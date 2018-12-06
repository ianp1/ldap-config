import { LdapDatePipePipe } from './ldap-date-pipe.pipe';

describe('LdapDatePipePipe', () => {
  it('create an instance', () => {
    const pipe = new LdapDatePipePipe();
    expect(pipe).toBeTruthy();
  });
});
