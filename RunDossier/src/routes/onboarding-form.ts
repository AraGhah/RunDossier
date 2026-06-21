import { type Request, type Response } from 'express';
import { submitIcpBrief, getOnboardingClientByToken } from '../services/onboarding.service.js';

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    (({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }) as Record<string, string>)[c] ?? c
  );
}

function page(title: string, body: string): string {
  return (
    '<!doctype html><meta charset="utf-8"><title>' + title + '</title>' +
    '<body style="font-family:system-ui,Segoe UI,sans-serif;background:#0b0f14;color:#e6edf3;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0">' +
    '<div style="max-width:520px;text-align:center;padding:24px"><h1 style="font-size:22px">' + title + '</h1>' +
    '<p style="color:#9bb0c3;line-height:1.6">' + body + '</p></div></body>'
  );
}

function formHtml(token: string, firstName: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Dossier onboarding</title>
<style>
  :root{color-scheme:dark}*{box-sizing:border-box}
  body{margin:0;font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,sans-serif;background:#0b0f14;color:#e6edf3;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px}
  .card{width:min(620px,94vw);background:#11161d;border:1px solid #222c38;border-radius:16px;padding:28px}
  h1{font-size:21px;margin:0 0 4px}p.sub{margin:0 0 18px;color:#9bb0c3;font-size:13px;line-height:1.5}
  label{display:block;font-size:13px;margin:16px 0 6px;color:#c4d2e0;font-weight:600}
  .hint{font-weight:400;color:#7c8ea0}
  textarea,input{width:100%;padding:11px 12px;border-radius:10px;border:1px solid #2a3848;background:#0d1219;color:#e6edf3;font-size:14px;font-family:inherit}
  textarea{min-height:84px;resize:vertical}
  textarea:focus,input:focus{outline:none;border-color:#3b82f6}
  button{margin-top:22px;width:100%;padding:12px;border:0;border-radius:10px;background:#3b82f6;color:#fff;font-size:15px;font-weight:600;cursor:pointer}
  button:disabled{opacity:.6}.out{margin-top:14px;font-size:13px}.err{color:#ff7b72}
</style></head>
<body><div class="card">
  <h1>Hi ${esc(firstName)}, let us set up your campaign</h1>
  <p class="sub">Two minutes. The more specific you are, the better your first batch.</p>
  <label>Describe your ideal prospect <span class="hint">(role, niche, company type)</span></label>
  <textarea id="icp" placeholder="e.g. Founders of US lead-generation agencies, 2-20 people, who post about cold email"></textarea>
  <label>Your offer in one sentence</label>
  <input id="offer" placeholder="e.g. We book 10-15 qualified sales calls a month for B2B agencies" />
  <label>Paste up to 3 first lines you love <span class="hint">(optional, one per line)</span></label>
  <textarea id="brandVoice" placeholder="Saw your post on deliverability - the warmup point nailed it."></textarea>
  <label>Target accounts <span class="hint">(optional - LinkedIn URLs or company names, one per line)</span></label>
  <textarea id="targetAccounts" placeholder="Leave blank to let us source by your ICP"></textarea>
  <button id="go">Submit</button>
  <div id="out" class="out"></div>
</div>
<script>
  var token = ${JSON.stringify(token)};
  var go=document.getElementById('go'), out=document.getElementById('out');
  go.onclick=async function(){
    var icp=document.getElementById('icp').value.trim();
    if(icp.length<10){out.className='out err';out.textContent='Please describe your ideal prospect.';return;}
    go.disabled=true;out.className='out';out.textContent='Submitting...';
    try{
      var res=await fetch('/api/onboarding/form',{method:'POST',headers:{'content-type':'application/json'},
        body:JSON.stringify({token:token,icp:icp,offer:document.getElementById('offer').value,brandVoice:document.getElementById('brandVoice').value,targetAccounts:document.getElementById('targetAccounts').value})});
      var data=await res.json();
      if(data.ok){document.querySelector('.card').innerHTML='<h1>Thanks!</h1><p style="color:#9bb0c3;line-height:1.6">We are reading your brief now and will email you the ICP we understood for your approval. Nothing gets sourced until you approve it.</p>';}
      else{out.className='out err';out.textContent=data.error||'Something went wrong.';go.disabled=false;}
    }catch(e){out.className='out err';out.textContent='Request failed: '+e.message;go.disabled=false;}
  };
</script></body></html>`;
}

/** GET /api/onboarding/form?token=... -> the self-hosted onboarding form. */
export async function handleOnboardingFormPage(req: Request, res: Response): Promise<void> {
  const token = typeof req.query.token === 'string' ? req.query.token : '';
  if (!token) {
    res.status(400).send(page('Invalid link', 'This onboarding link is missing its token.'));
    return;
  }
  const client = await getOnboardingClientByToken(token);
  if (!client) {
    res.status(404).send(page('Link not found', 'This onboarding link is invalid or expired.'));
    return;
  }
  if (client.form_submitted_at) {
    res.status(200).send(page('Already submitted', 'We have your details and emailed you the ICP to approve - check your inbox.'));
    return;
  }
  res.status(200).type('html').send(formHtml(token, client.client_first_name || 'there'));
}

/** POST /api/onboarding/form -> parse + store, then email the parsed ICP for approval. */
export async function handleOnboardingFormSubmit(req: Request, res: Response): Promise<void> {
  const body = req.body as {
    token?: string;
    icp?: string;
    offer?: string;
    brandVoice?: string;
    targetAccounts?: string;
  };
  const token = (body.token || '').trim();
  const icp = (body.icp || '').trim();
  if (!token) {
    res.status(400).json({ ok: false, error: 'Missing token.' });
    return;
  }
  if (icp.length < 10) {
    res.status(400).json({ ok: false, error: 'Please describe your ideal prospect.' });
    return;
  }
  const brandVoice = (body.brandVoice || '').split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 3);
  try {
    const client = await submitIcpBrief(token, icp, {
      offer: (body.offer || '').trim() || undefined,
      brandVoice,
      targetAccounts: (body.targetAccounts || '').trim() || undefined,
    });
    if (!client) {
      res.status(404).json({ ok: false, error: 'This link is invalid or expired.' });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
}
