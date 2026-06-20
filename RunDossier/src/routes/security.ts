import type { Request, Response } from 'express';

/** RFC 9116 security.txt — ITSAP.60.005 vulnerability disclosure contact. */
const SECURITY_TXT = `# Security contact — Preframe / Dossier (ITSAP.60.005)
Contact: mailto:ara@getdossier.co
Expires: 2027-06-20T00:00:00.000Z
Preferred-Languages: en, fr
Canonical: https://getdossier.co/.well-known/security.txt
Policy: https://github.com/getdossier/preframe/blob/main/SECURITY.md
Acknowledgments: https://github.com/getdossier/preframe/blob/main/SECURITY.md
`;

export function handleSecurityTxt(_req: Request, res: Response): void {
  res.type('text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(SECURITY_TXT);
}
