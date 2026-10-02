export interface SshInput {
  host: string;
  domain: string;
  user: string;
  pass: string;
  rsa: string;
  vty: string;
}

export function sshConfig({ host, domain, user, pass, rsa, vty }: SshInput): string {
  return (
    `conf t\nhostname ${host}\nip domain-name ${domain}\ncrypto key generate rsa modulus ${rsa}\n!\n` +
    `username ${user} privilege 15 secret ${pass}\n!\nip ssh version 2\nip ssh time-out 60\n` +
    `ip ssh authentication-retries 3\n!\nline vty ${vty}\n transport input ssh\n login local\n` +
    ` exec-timeout 5\n!\nline con 0\n exec-timeout 5\n logging synchronous\n!\nend\n` +
    `copy running-config startup-config`
  );
}
