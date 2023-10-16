## Overview

Inventory of hosts is managed in `inventory.yml`.
Common variables and adresses can be found there.

`group_vars` contains encrypted secrets, mainly ldap access

## Execute
Move terminal to root (ansible_setup) and execute command
```
ansible-playbook <task_name>/playbook.yml -i inventory.yml --limit <host(s)> -u <user> --ask-vault-pass
```

## Passwords and ssh
Vault password can be found in Passbolt, shared with group IT-Server.
SSH access user must be sudo user.