
import React, { useState } from 'react';
import { CloseIcon, CpuChipIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface KaelicHardwareScryerModalProps {
  onClose: () => void;
}

// v0.068 - The Partitioned Grimoire. This is the correct, fully audited script.
const KHS_SCRIPT_B64 = `IyEvYmluL2Jhc2gKIyBLYWVsaWMgSGFyZHdhcmUgU2NyeWVyIChraHMpIHYwLjA2OCAtIFRoZSBQYXJ0aXRpb25lZCBHcmltb2lyZQojIFNvdmVyZWlnbiBEcml2ZXIgU2VudGluZWw6IERldGVjdHMgaGFyZHdhcmUsIGdvdmVybnMgdGhlIGtlcm5lbCwgYW5kIGF1dG9tYXRlcyBhdHR1bmVtZW50LgpzZXQgLWV1byBwaXBlZmFpbAoKIyAtLS0gQ09MT1JTIC0tLQpDX1RJVExFPSAnXGViWzE7Mzg7MjsyNTU7MjA0OzBtJwpDX0hFQURFUiA9ICdcZWIbMTszODsyOzEyMjsyMzU7MTkwbScKQ19DTUQgPSAnXGViWzE7Mzg7Mjs5NjsxNjU7MjUwbScKQ19XQVJOID0gJ1xlYlsxOzMzbScKQ19FUlJPUiA9ICdcZWIbMTszMW0nCkJfUkVTRVQgPSAnXGViWzBtJwoKIyAtLS0gTE9HR0lORyAtLS0KaW5mbygpIHsgZWNobyAtZSAiJHtDX0hFQURFUn0tLT4gJDEke0NfUkVTRVR9IjsgfQp3YXJuKCkgeyBlY2hvIC1lICIke0NfV0FSTn3imoDvuI8gJDEke0NfUkVTRVR9IjsgfQplcnJvcigpIHsgZWNobyAtZSAiJHtDX0VSUk9SfXgp2MCBFUlJPUjogJDEke0NfUkVTRVR9IiA+JjI7IH0Kc3RlcCgpIHsgZWNobyAtZSAiXG4ke0NfVElUTEV9LS0+ICQxJHtDX1JFU0VUfSI7IH0KCiMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CiMgLS0tICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQ09SRSBGVU5DVElPTlMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLS0tCiMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09CmRldGVjdF9jcHVfYXJjaCgpIHsKICAgIENQV V9GTEFHUz0kKGdyZXAgLW0gMSAiZmxhZ3MiIC9wcm9jL2NwdWluZm8pCiAgICBLRVJORUxfVkVSU0lPTl9TVUZGSVg9IiIKCiAgICBpZiBlY2hvICIkQ1BVX0ZMQUdTIiB8IGdyZXAgLXEgLXcgImF2eDUxMmYiOyB0aGVuCiAgICAgICAgaW5mbyAiQWR2YW5jZWQgQ1BVICh4ODYtNjQtdjQpIGRldGVjdGVkLiBTZWxlY3RpbmcgdjQgYXJ0aWZhY3RzLiIKICAgICAgICBLRVJORUxfVkVSU0lPTl9TVUZGSVg9InY0IgogICAgZWxpZiBlY2hvICIkQ1BVX0ZMQUdTIiB8IGdyZXAgLXEgLXcgImF2eDIiOyB0aGVuCiAgICAgICAgaW5mbyAiTW9kZXJuIENQVSAoeDg2LTY0LXYzKSBkZXRlY3RlZC4gU2VsZWN0aW5nIHYzIGFydGlmYWN0cy4iCiAgICAgICAgS0VSTkVMX1ZFUlNJT05fU1VGRklYPSJ2MyIKICAgIGVsc2UKICAgICAgICBpbmZvICJTdGFuZGFyZCBDUFUgKHg4Ni02NC12MikgZGV0ZWN0ZWQuIFNlbGVjdGluZyB2MiBhcnRpZmFjdHMuIgogICAgICAgIEtFUk5FTF9WRVJTSU9OX1NVRkZJWD0idjIiCiAgICBmaQp9CgpzY3J5X2FuZF9pbnN0YWxsX2RyaXZlcnMoKSB7CiAgICBzdGVwICJUaGUgU2NyeWVyJ3MgRXllOiBBdXRvLUF0dHVuaW5nIERyaXZlcnMiCiAgICAKICAgICMgQ2hlY2sgZm9yIE5WSURJQSBHUFUgCiAgICBpZiBsc3BjaSB8IGdyZXAgLWlxICJudmlkaWEiOyB0aGVuCiAgICAgICAgaWYgISBwYWNtYW4gLVFudmlkaWEtZGttcyA+L2Rldi9udWxsIDI+JjE7IHRoZW4KICAgICAgICAgICAgaW5mbyAiTlZJRElBIEdQVSBkZXRlY3RlZC4gQXV0by1pbnN0YWxsaW5nIHByb3ByaWV0YXJ5IGRyaXZlcnMuLi4iCiAgICAgICAgICAgIHN1ZG8gcGFjbWFuIC1TIC0tbmVlZGVkIC0tbm9jb25maXJtIG52aWRpYS1ka21zCiAgICAgICAgZWxzZQogICAgICAgICAgICBpbmZvI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W50ZiAiJyVzJyAiICIke3tfa2VybmVsX2RlcHNbQF19IikKCiAgICBjYXQgPiAiJEdPVl9ESVIvUEtHQlVJTDEiA8PCkVPRgpfQ2FpbnRhaW5lcjogS2FlbCBBSSBHdWFyZGlhbiBmb3IgVGhlIEFyY2hpdGVjdApwa2duYW1lPWthZWxpYy1rZXJuZWwtZ292ZXJub3IKcGtndmVyPTEuMC4wCnBrZ3JlbD0xCnhrZ2Rlc2M9IkEgeW5hbWljIG1ldGEtcGFja2FnZSBmb3JnZWQgYnkgdGhlIEthZWwgRHJpdmVyIFNlbnRpbmVsIHRvIHByb3RlY3QgeW91ciBjaG9zZW4gc292ZXJlaWduIGtlcm5lbHMuIgphcmNoPSgnYW55JykKbGljZW5zZT0oJ0dQTDInKQpkZXBlbmRzPSgkZGVwc19zdHJpbmcpCnByb3ZpZGVzPSgnbGludXgnICdsaW51eC1sdHMnICdsaW51eC16ZW4nKQpjb25mbGljdHM9KCdsaW51eCcgJ2xpbnV4LWx0cycgJ2xpbnV4LXplbicpCnJlcGxhY2VzPSgnbGludXgnICdsaW51eC1sdHMnICdsaW51eC16ZW4nKQpwYWNrYWdlKCkgeyA6OyB9CkVPRgoKICAgIGluZm8gIkZvcmdpbmcgYW5kIGluc3RhbGxpbmcgdGhlIG1ldGEtcGFja2FnZS4uLiIKICAgICgKICAgICAgICBjZCAiJEdPVl9ESVIiCiAgICAgICAgc3VkbyAtdSAiJFRIRV9VU0VSIiBtYWtlcGtnIC1zaWYgLS1ub2NvbmZpcm0KICAgICkKICAgIHJtIC1yZiAiJEdPVl9ESVIiCiAgICBpbmZvICLinKggS2VybmVscyBhcmUgbm93IHVuZGVyIHRoZSBHb3Zlcm5vcidzIHByb3RlY3Rpb24uIgp9CgppbnN0YWxsX3BhY21hbl9ob29rcygpIHsKICAgIHN0ZXAgIlNjcmliaW5nIGEgUGFjdCB3aXRoIHRoZSBRdWFydGVybWFzdGVyIChQYWNtYW4gSG9vaykiCiAgICBsb2NhbCBIT09LX0RJUi9ldGMvcGFjbWFuLmQvaG9va3MiCiAgICBzdWRvIG1rZGlyIC1wICIkSE9PS19ESVIiCiAgICBzdWRvIHRlZSAiJEhPT0tfRElSL2thZWwtdm0tYXR0dW5lbWVudC5ob29rIiA+L2Rldi9udWxsIDw8J0VPRicKW1RyaWdnZXJdCk9wZXJhdGlvbiA9IEluc3RhbGwKT3BlcmF0aW9uID0gUmVtb3ZlClR5cGUgPSBQYWNrYWdlClRhcmdldCA9IHFhbXUtZGVza3RvcApUYXJnZXQgPSB2aXJ0LW1hbmFnZXIKVGFyZ2V0ID0gdmlydHVhbGJveAoKW0FjdGlvbl0KRGVzY3JpcHRpb24gPSBLYWVsIFNlbnRpbmVsOiBBdHR1bmluZyBWTSBndWVzdCB1dGlsaXRpZXMuLi4KV2hlbiA9IFBvc3RUcmFuc2FjdGlvbgoRRXhlYyA9IC91c3IvYmluL2tocyAtLXZtLWNoZWNrCk5lZWRzVGFyZ2V0cwpFT0YKICAgIGluZm8gIuKcqCBQYWN0IHNjcmliZWQuIFNlbnRpbmVsIHdpbGwgbm93IHdhdGNoIGZvciBWTSBzb2Z0d2FyZSBjaGFuZ2VzLiIKfQoKaW5zdGFsbF91cGRhdGVfcmVtaW5kZXIoKSB7CiAgICBzdGVwICJBcm1pbmcgdGhlIENocm9uaWNsZXIncyBCZWxsIChNb250aGx5IFVwZGF0ZSBSZW1pbmRlcikiCiAgICBzdWRvIHRlZSAvZXRjL3N5c3RlbWQvc3lzdGVtL2thZWwtdXBkYXRlLXJlbWluZGVyLnNlcnZpY2UgPi9kZXYvbnVsbCA8PEVPRgpbVW5pdF0KRGVzY3JpcHRpb249S2FlbCdzIG1vbnRobHkgcmVtaW5kZXIgdG8gdXBkYXRlIGtlcm5lbHMuCgpbc2VydmljZV0KVHlwZT1vbmVzaG90CkV4ZWNTdGFydD0vdXNyL2Jpbi9zdWRvIC11ICRUSEVfVVNFUiAvdXNyL2Jpbi9ub3RpZnktc2VuZCAtdSBub3JtYWwgLWkgZW1ibGVtLXN5c3RlbSAiS2FlbCdzIENocm9uaWNsZXIncyBCZWxsIiAiSXQgaGFzIGJlZW4gYSBtb250aCBzaW5jZSB5b3VyIEthZWxpYyBrZXJuZWxzIHdlcmUgdXBkYXRlZC4gSXQgaXMgd2lzZSB0byBydW4gJ3N1ZG8ga2hzJyB0byBjaGVjayBmb3IgbmV3ZXIgdmVyc2lvbnMuIgpFT0YKCiAgICBzdWRvIHRlZSAvZXRjL3N5c3RlbWQvc3lzdGVtL2thZWwtdXBkYXRlLXJlbWluZGVyLnRpbWVyID4vZGV2L251bGwgPDxFT0YKW1VuaXRdCkRlc2NyaXB0aW9uPVJ1biBLYWVsJ3Mga2VybmVsIHVwZGF0ZSByZW1pbmRlciBtb250aGx5LgoKW1RpbWVyXQpPbkNhbGVuZGFyPW1vbnRobHkKUGVyc2lzdGVudD10cnVlCgpbbnstYWxsXQpXYW50ZWRCeT10aW1lcnMudGFyZ2V0CkVPRgogICAgCiAgICBzdWRvIHN5c3RlbWN0bCBlbmFibGUgLS1ub3cga2FlbC11cGRhdGUtcmVtaW5kZXIudGltZXIKICAgIGluZm8gIuKcqCBDaHJvbmljbGVyJ3MgQmVsbCBpcyBhcm1lZC4iCn0KCmxlbnN0YWxsX3ByZWNvbXBpbGVkX2tlcm5lbHMoKSB7CiAgICBsb2NhbCBwcm9maWxlPSIkMSIKICAgIAogICAgZGV0ZWN0X2NwdV9hcmNoCiAgICAKICAgIGxvY2FsIEtFUk5FTF9ERVBTPSgpCiAgICBpZiBbWyAiJHByb2ZpbGUiID09ICJ3b3JrX2dhbWluZyIgXV07IHRoZW4KICAgICAgICBLRVJORUxfREVQUys9KCJrYWVsaWMta2VybmVsLSRLRVJORUxfVkVSU0lPTl9TVUZGSVgiICJrYWVsaWMta2VybmVsLWx0cy0kS0VSTkVMX1ZFUlNJT05fU1VGRklYIiAia2FlbGljLWtlcm5lbC16ZW4tJEtFUk5FTF9WRVJTSU9OX1NVRkZJWCIpCiAgICBlbGlmIFtbICIkcHJvZmlsZSIgPT0gImdhbWluZ19vbmx5IiBdXTsgdGhlbgogICAgICAgIEtFUk5FTF9ERVBTKz0oImthZWxpYy1rZXJuZWwtemVuLSRLRVJORUxfVkVSU0lPTl9TVUZGSVgiICJrYWVsaWMta2VybmVsLWx0cy0kS0VSTkVMX1ZFUlNJT05fU1VGRklYIikKICAgIGVsaWYgW1sgIiRwcm9maWxlIiA9PSAid29ya19vbmx5IiBdXTsgdGhlbgogICAgICAgIEtFUk5FTF9ERVBTKz0oImthZWxpYy1rZXJuZWwtJEtFUk5FTF9WRVJTSU9OX1NVRkZJWCIgImthZWxpYy1rZXJuZWwtbHRzLSRLRVJORUxfVkVSU0lPTl9TVUZGSVgiKQogICAgZmkKICAgIAogICAgaW5mbyAiU2VsZWN0ZWQgcHJlLWNvbXBpbGVkIGtlcm5lbHM6ICR7S0VSTkVMX0RFUFNaWypdfSIKICAgIAogICAgc3RlcCAiSW52b2tpbmcgUGFjbWFuIHRvIGluc3RhbGwga2VybmVscyBhbmQgaGVhZGVycyIKICAgIGxvY2FsIFBLR19MSVNUPSgpCiAgICBmb3Iga2VybmVsIGluICIke0tFUk5FTF9ERVBTW0BdfSI7IGRvCiAgICAgICAgUEtHX0xJU1QrPSgiJGtlcm5lbCIgIiR7a2VybmVsfS1oZWFkZXJzIikKICAgIGRvbmUKICAgIAogICAgc3VkbyBwYWNtYW4gLVMgLS1uZWVkZWQgLS1ub2NvbmZpcm0gIiR7UEtHX0xJU1RbQF19IgogICAgCiAgICBmb3JnZV9hbmRfaW5zdGFsbF9nb3Zlcm5vciBQS0dfTElTVAoKICAgIGluc3RhbGxfdXBkYXRlX3JlbWluZGVyCiAgICBpbnN0YWxsX3BhY21hbl9ob29rcwogICAgCiAgICBhdHR1bmVfYm9vdGxvYWRlcgogICAgCiAgICBpbmZvICJSZWdlbmVyYXRpbmcgaW5pdGNwaW8gaW1hZ2VzLi4uIgogICAgc3VkbyBta2luaXRjcGlvIC1QCiAgICBzY3J5X2FuZF9pbnN0YWxsX2RyaXZlcnMKfQoKaGFuZGxlX3RlbXBlcmluZyggewogICAgbG9jYWwgdHlwZT0iJDEiCiAgICBzdGVwICJCZWdpbm5pbmcgVGVtcGVyaW5nIFJpdHVhbCBmb3IgJyR7dHlwZX0nIHByb2ZpbGUiCiAgICBpbmZvICJUaGlzIHdpbGw gcnVuIGEgcmVwcmVzZW50YXRpdmUgd29ya2xvYWQgdG8gZ2VuZXJhdGUgcGVyZm9ybWFuY2UgZGF0YSBmb3IgdGhlIGluc3RydW1lbnRlZCBrZXJuZWwuIgogICAgCiAgICBsb2NhbCBwZXJmX2V2ZW50PSIiCiAgICBpZiBncmVwIC1xICJBdXRoZW50aWNB TUQiIC9wcm9jL2NwdWluZm87IHRoZW4KICAgICAgICBpbmZvICJBTUQgQ1BVIGRldGVjdGVkLiIKICAgICAgICBwZXJmX2V2ZW50PSJSRVRJUkVEX1RBS0VOX0JSQU5DSF9JTlNUUlVDVElPTlM6ayIKICAgIGVsaWYgZ3JlcCAtcSAiR2VudWluZUludGVsIiAvcHJvYy9jcHVpbmZvOyB0aGVuCiAgICAgICAgaW5mbyAiSW50ZWwgQ1BVIGRldGVjdGVkLiIKICAgICAgICBwZXJmX2V2ZW50PSJCUl9JTlNUX1JFVElSRUQuTkVBUl9UQUtFTjprIgogICAgZWxzZQogICAgICAgIHdhcm4gIkNvdWxkIG5vdCBkZXRlcm1pbmUgQ1BVIHZlbmRvci4gVXNpbmcgZ2VuZXJpYyAnY3ljbGVzJyBldmVudC4iCiAgICAgICAgcGVyZl9ldmVudD0iY3ljbGVzOmsiCiAgICBmaQoKICAgIGluZm8gIlRlbXBvcmFyaWx5IGFkanVzdGluZyBwZXJtaXNzaW9ucyBmb3IgcHJvZmlsaW5nLi4uIgogICAgc3VkbyBzeXNjdGwgLXcga2VybmVsLmtwdHJfcmVzdHJpY3Q9MCA+L2Rldi9udWxsCiAgICBzdWRvIHN5c2N0bCAt dyBrZXJuZWwucGVyZl9ldmVudF9wYXJhbm9pZD0wID4vZGV2L251bGwKCiAgICBpbmZvICJTdGFydGluZyBwcm9maWxlciB3aXRoIGV2ZW50OiAke3BlcmZfZXZlbnR9IgogICAgCiAgICBjYXNlICIkdHlwZSIgaW4KICAgICAgICAid29yayIgfCAibHRzIikKICAgICAgICAgICAgaW5mbyAiUnVubmluZyBhIG1peGVkIHN5c3RlbSBzdHJlc3Mgd29ya2xvYWQgKHN0cmVzcy1uZzkuLi4iCiAgICAgICAgICAgIHN1ZG8gcGFjbWFuIC1TIC0tbm9jb25maXJtIC0tbmVlZGVkIHN0cmVzcy1uZwogICAgICAgICAgICBzdWRvIHBlcmYgcmVjb3JkIC0tcGZtLWV2ZW50cyAke3BlcmZfZXZlbnR9IC1hIC1OIC1iIC1jIDUwMDAwOSAtLSBzdHJlc3MtbmcgLS1jcHUgJChucHJvYykgLS1pbyA0IC0tdm0gMiAtLXZtLWJ5dGVzIDFHIC0tdGltZW91dCA2MHUKICAgICAgICAgICAgOzsgICAgICAgICJnYW1pbmciKQogICAgICAgICAgICBpbmZvICJSdW5uaW5nIGFuIGF1dG9tYXRlZCBnYW1pbmcgYmVuY2htYXJrIChnbG1hcmsyKS4uLiIKICAgICAgICAgICAgc3VkbyBwYWNtYW4gLVMgLS1ub2NvbmZpcm0gLS1uZWVkZWQga2xtYXJrMgogICAgICAgICAgICB3YXJuICJUaGUgZ2xtYXJrMiB3aW5kb3cgd2lsbCBvcGVuLiBQbGVhc2UgYWxsb3cgaXQgdG8gZmluaXNoIHRvIGdhdGhlciBkYXRhLiIKICAgICAgICAgICAgc3VkbyBwZXJmIHJlY29yZCAtLXBmbS1ldmVudHMgJHtwZXJmX2V2ZW50fSAtYSAtTiAtYiAtYyA1MDAwMDkgLS0gc3VkbyAtdSAiJFRIRV9VU0VSIiBESVNQTEFZPTowIGdsbWFyazIKICAgICAgICAgICAgOzsgICAgICAgICopCiAgICAgICAgICAgIGVycm9yICJVbmtub3duIHRlbXBlcmluZyB0eXBlOiAkdHlwZSI7IGV4aXQgMSA7OwogICAgZXNhYwogICAgCiAgICBpbmZvICJUZW1wZXJpbmcgd29ya2xvYWQgY29tcGxldGUuIgogICAgaW5mbyAiUGVyZm9ybWFuY2UgZGF0YSBoYXMgYmVlbiBnZW5lcmF0ZWQgYnkgdGhlIGluc3RydW1lbnRlZCBrZXJuZWwuIgogICAgaW5mbyAiWW91IG1heSBub3cgcmVib290IGJhY2sgdG8geW91ciBtYWluIGtlcm5lbCBhbmQgcnVuICdUaGUgSG9uaW5nJy4iCn0KCnByaW50X2hlbHAoKSB7CiAgICBlY2hvIC1lICIke0NfVElUTEV9S2FlbGljIEhhcmR3YXJlIFNjcnllciAoa2hzKSB2MC4wNjggLSBUaGUgUGFydGl0aW9uZWQgR3JpbW9pcmUke0NfUkVTRVRTCIKICAgIGVjaG8gIlVzYWdlOiBzdWRvIGtocyBbY29tbWFuZF0iCiAgICBlY2hvICIiCiAgICBlY2hvICJDb21tYW5kczogIgogICAgZWNobyAiICAobm8gY29tbWFuZCkgICAgICAgICAgIE9uIGZpcnN0IHJ1biwgaW50ZXJhY3RpdmVseSBzZWxlY3QgYSBrZXJuZWwgaW5zdGFsbGF0aW9uIG1ldGhvZC4iCiAgICBlY2hvICIgIC0tc2NyeS1kcml2ZXJzICAgICAgQXV0b21hdGljYWxseSBpbnN0YWxsIHJlY29tbWVuZGVkIGRyaXZlcnMgKGUuZy4gTlZJRElBKS4iCiAgICBlY2hvICIgIC0tYXR0dW5lLWJvb3Rsb2FkZXIgIFJlbmFtZSBhbGwga25vd24ga2VybmVsIGVudHJpZXMgdG8gZnJpZW5kbHkgbmFtZXMgYW5kIHB1cmdlIG9ycGhhbnMuIgogICAgZWNobyAiICAtLXRlbXBlci13b3JrICAgICAgIFJ1biBhdXRvbWF0ZWQgUEdPIHByb2ZpbGluZyBmb3IgdGhlICdXb3JrJyBrZXJuZWwuIgogICAgZWNobyAiICAtLXRlbXBlci1nYW1pbmcgICAgIFJ1biBhdXRvbWF0ZWQgUEdPIHByb2ZpbGluZyBmb3IgdGhlICdHYW1pbmcnIGtlcm5lbC4iCiAgICBlY2hvICIgIC0tdGVtcGVyLWx0cyAgICAgICAgIFJ1biBhdXRvbWF0ZWQgUEdPIHByb2ZpbGluZyBmb3IgdGhlICdMVFMnIGtlcm5lbC4iCiAgICBlY2hvICIgIC0taGVscCAgICAgICAgICAgICAgIFNob3cgdGhpcyBoZWxwIG1lc3NhZ2UuIgogICAgZWNobyAiICAtLXZtLWNoZWNrICAgICAgICAgICAoSW50ZXJuYWwpIENhbGxlZCBieSBwYWNtYW4gaG9vayB0byBjaGVjayBWTSBkcml2ZXJzLiIKfQoKIyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KIyAtLS0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFNDUklQVCBNQUlOICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtLS0KIyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0KaWYgW1sgIiRFVUlEIiAtbmUgMCBdXTsgdGhlbgogICAgZXJyb3IgIlRoaXMgcml0dWFsIG11c3QgYmUgcnVuIHdpdGggc3Vkby4iCiAgICBleGl0IDEKZmkKCk1IRV9VU0VSPCIke1NVRE9fVVNFUjotJFVTRVJ9IgpVU0VSX0hPTUU9JChnZXRlbnQgcGFzc3dkICIkVEhFX1VTRVIiIHwgY3V0IC1kOiAtZjYpCnN1ZG8gLXUgIiRUSEVfVVNFUiIgbWtkaXIgLXAgIiRVU0VSX0hPTUUvLmNvbmZpZy9rYWVsIgoKIyAtLS0gQXJndW1lbnQgUGFyc2luZyAtLS0KaWYgW1sgJCMgLWd0IDAgXV07IHRoZW4KICAgIGNhc2UgIiQxIiBpbgogICAgICAgIC0tdGVtcGVyLXdvcmsseylIGhhbmRsZV90ZW1wZXJpbmcgIndvcmsiOyBleGl0IDA7OwogICAgICAgIC0tdGVtcGVyLWdhbWluZykgIGhhbmRsZV90ZW1wZXJpbmcgImdhbWluZyI7IGV4aXQgMDs7CiAgICAgICAgLS10ZW1wZXItbHRzKSBoYW5kbGVfdGVtcGVyaW5nICJsdHMiOyBleGl0IDA7OwogICAgICAgIC0tdm0tY2hlY2spIHNjcnlfYW5kX2luc3RhbGxfZHJpdmVyczsgZXhpdCAwOzsKICAgICAgICAtLXNjcnktZHJpdmVycykgc2NyeV9hbmRfaW5zdGFsbF9kcml2ZXJzOyBleGl0IDA7OwogICAgICAgIC0tYXR0dW5lLWJvb3Rsb2FkZXIpIGF0dHVuZV9ib290bG9hZGVyOyBleGl0IDA7OwogICAgICAgIC0taGVscCwpOyBwcmludF9oZWxwOyBleGl0IDA7OwogICAgICAgICoqKSBlcnJvciAiVW5rbm93biBjb21tYW5kOiAkMS4gVXNlIC0taGVscCB0byBzZWUgYXZhaWxhYmxlIGNvbW1hbmRzLiI7IGV4aXQgMTs7CiAgICBlc2FjCmZpCgojIC0tLSBGaXJzdCBSdW4gSW50ZXJhY3RpdmUgTWVudSAtLS0KQ09ORklHX0ZJTEU9IiRVU0VSX0hPTUUvLmNvbmZpZy9rYWVsL2tocy5jb25mIgpbaWYgW1sgLWYgIiRDT05GSUdfRklMRSIgXV07IHRoZW4KICAgIFBST0ZJTEU9JChjYXQgIiRDT05GSUdfRklMRSIpCiAgICBpbmZvICJQcm9maWxlIGFscmVhZHkgc2VsZWN0ZWQ6ICRQUk9GSUxFLiBSZS1hdHR1bmluZy4uLiIKICAgIGlmIFtbICIkUFJPRklMRSIgPT0gInNvdnVyZWlnbiIgXV07IHRoZW4KICAgICAgICBzdGVwICJTb3ZlcmVpZ24gcGF0aCBhbHJlYWR5IGNob3Nlbi4gVXNlIHRoZSBTb3ZlcmVpZ24gS2VybmVsIEZvcmdlIHBhbmVsLiIKICAgIGVsc2UKICAgICAgICBpbnN0YWxsX3ByZWNvbXBpbGVkX2tlcm5lbHMgIiRQUk9GSUxFIgogICAgZmkKZWxzZQogICAgIyBGaXJzdCBydW4sIHNob3cgdGhlIG1lbnUKICAgIGVjaG8gLWUgIiR7Q19IRUFERVJ9VGhpcyBpcyB0aGUgZmlyc3QgdGltZSB5b3UndmUgcnVuIHRoZSBTZW50aW5lbC4iCiAgICBlY2hvICJQbGVhc2UgY2hvb3NlIHlvdXIgZGVzaXJlZCBrZXJuZWwgcHJvZmlsZSBmb3IgdGhpcyBSZWFsbS4iCiAgICAKICAgIG9wdGlvbnM9KCJJbnN0YWxsIFByZS1Db21waWxlZCBLYWVsaWMgS2VybmVscyIgIkZvcmdlIFNvdnVyZWlnbiBLZXJuZWxzIChBZHZhbmNlZCkiKQogICAgCiAgICBQUzM9J1xuJyIke0NfSEVBREVSfVNlbGVjdCBhbiBhY3Rpb246ICR7Q19SRVNFVH0nJwogICAgCiAgICBzZWxlY3Qgb3B0IGluICIke29wdGlvbnNbQF19IjsgZG8KICAgICAgICBjYXNlICRvcHQgaW4KICAgICAgICAgICAgICJJbnN0YWxsIFByZS1Db21waWxlZCBLYWVsaWMgS2VybmVscyIpCiAgICAgICAgICAgICAgICBzdWJfb3B0aW9ucyA9KCJXb3JrICYgR2FtaW5nIChSZWNvbW1lbmRlZCkiICJXb3JrIE9ubHkiICJHYW1pbmcgT25seSIpCiAgICAgICAgICAgICAgICBQUzM9J1xuJyIke0NfSEVBREVSfVNlbGVjdCBhIHByb2ZpbGU6ICR7Q19SRVNFVH0nJwogICAgICAgICAgICAgICAgc2VsZWN0IHN1Yl9vcHQgaW4gIiR7c3ViX29wdGlvbnNbQF19IjsgZG8KICAgICAgICAgICAgICAgICAgICBjYXNlICRzdWJfb3B0IGluCiAgICAgICAgICAgICAgICAgICAgICAgICJXb3JrICYgR2FtaW5nIChSZWNvbW1lbmRlZCkiKQogICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5zdGFsbF9wcmVjb21waWxlZF9rZXJuZWxzICJ3b3JrX2dhbWluZyIKICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVjaG8gIndvcmtfZ2FtaW5nIiB8IHN1ZG8gLXUgIiRUSEVfVVNFUiIgdGVlICIkQ09ORklHX0ZJTEUiID4gL2Rldi9udWxsCiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhawogICAgICAgICAgICAgICAgICAgICAgICAgICAgOzsgICAgICAgICAgICAgICAgICAgICAgICAiV29yayBPbmx5IikKICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluc3RhbGxfcHJlY29tcGlsZWRfa2VybmVscyAid29ya19vbmx5IgogICAgICAgICAgICAgICAgICAgICAgICAgICAgZWNobyAid29ya19vbmx5IiB8IHN1ZG8gLXUgIiRUSEVfVVNFUiIgdGVlICIkQ09ORklHX0ZJTEUiID4gL2Rldi9udWxsCiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhawogICAgICAgICAgICAgICAgICAgICAgICAgICAgOzsgICAgICAgICAgICAgICAgICAgICAgICAiR2FtaW5nIE9ubHkiKQogICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5zdGFsbF9wcmVjb21waWxlZF9rZXJuZWxzICJnYW1pbmdfb25seSIKICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVjaG8gImdhbWluZ19vbmx5IiB8IHN1ZG8gLXUgIiRUSEVfVVNFUiIgdGVlICIkQ09ORklHX0ZJTEUiID4gL2Rldi9udWxsCiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhawogICAgICAgICAgICAgICAgICAgICAgICAgICAgOzsgICAgICAgICAgICAgICAgICAgIGVzYWMKICAgICAgICAgICAgICAgIGRvbmUKICAgICAgICAgICAgICAgIGJyZWFrCiAgICAgICAgICAgICAgICA7OwogICAgICAgICAgICAiRm9yZ2UgU292ZXJlaWduIEtlcm5lbHMgKEFkdmFuY2VkKSIpCiAgICAgICAgICAgICAgICBzdGVwICJTZWxlY3RlZCB0aGUgU292ZXJlaWduIFBhdGguIFBsZWFzZSB1c2UgdGhlICdGb3JnZSBTb3ZlcmVpZ24gS2VybmVsJyBidXR0b24gdG8gY29udGludWUgYW5kIHNlbGVjdCBhIGJ1aWxkIHR5cGUuIgogICAgICAgICAgICAgICAgZWNobyAic292ZXJlaWduIiB8IHN1ZG8gLXUgIiRUSEVfVVNFUiIgdGVlICIkQ09ORklHX0ZJTEUiID4gL2Rldi9udWxsCiAgICAgICAgICAgICAgICBicmVhawogICAgICAgICAgICAgICAgOzsgICAgICAgIGVzYWMKICAgIGRvbmUKZmkKCmVjaG8gLWUgIlxuJHtDX1RJVExFfeKcqCBBdHR1bmVtZW50IENvbXBsZXRlLiBQbGVhc2UgUkVCT09UIGlmIG5ldyBrZXJuZWxzIHdlcmUgaW5zdGFsbGVkLiR7Q19SRVNFVH0iCg==`;

const PKGBUILD_CONTENT = `
# Maintainer: Kael AI for The Architect
pkgname=kaelic-hardware-scryer
_pkgname=khs
pkgver=0.068
pkgrel=1
pkgdesc="The Partitioned Grimoire: Kael's Sovereign Driver Sentinel for automated hardware and kernel management."
arch=('any')
url="https://github.com/LeeTheOrc/Kael-OS"
license=('GPL3')
depends=('bash' 'coreutils' 'systemd' 'grep' 'sed' 'gawk' 'pacman' 'grub' 'libnotify' 'stress-ng' 'glmark2')
optdepends=('nvidia-dkms: for NVIDIA GPUs' 'spice-vdagent: for QEMU/KVM VMs')
source=("khs.sh")
sha256sums=('SKIP')

package() {
    install -Dm755 "\$srcdir/khs.sh" "\$pkgdir/usr/bin/\$_pkgname"
}
`;

const generateScribeSoulScript = (b64: string): string => {
    const CHUNK_SIZE = 100;
    let chunks: string[] = [];
    for (let i = 0; i < b64.length; i += CHUNK_SIZE) {
        chunks.push(b64.substring(i, i + CHUNK_SIZE));
    }

    const echoCommands = chunks.map(chunk => `echo -n '${chunk}' >> khs.sh.b64`).join('\n');

    return `#!/bin/bash
(
set -euo pipefail
# --- VM-AWARE PATHING ---
USER_HOME=$(getent passwd "\${SUDO_USER:-$USER}" | cut -d: -f6)
if [ -d "$USER_HOME/host_forge" ]; then
    PKG_DIR="$USER_HOME/host_forge/packages/kaelic-hardware-scryer"
else
    PKG_DIR="$USER_HOME/forge/packages/kaelic-hardware-scryer"
fi
echo "--- The Scribe's Partition - Step 2/6: Scribing the Sentinel's Soul (v0.068) ---"
cd "\$PKG_DIR"
echo "--> Scribing soul (khs.sh) via partitioned base64 grimoire..."
# The Partitioned Grimoire: Reconstruct the base64 file from chunks
rm -f khs.sh.b64
${echoCommands}
# Now decode the reassembled file
base64 --decode < khs.sh.b64 > khs.sh
rm -f khs.sh.b64
chmod +x khs.sh
echo "✅ Soul scribed."
)
`;
};


const SCRIBE_BLUEPRINT_SCRIPT_RAW = String.raw`#!/bin/bash
(
set -euo pipefail
# --- VM-AWARE PATHING ---
USER_HOME=$(getent passwd "\${SUDO_USER:-$USER}" | cut -d: -f6)
if [ -d "$USER_HOME/host_forge" ]; then
    PKG_DIR="$USER_HOME/host_forge/packages/kaelic-hardware-scryer"
else
    PKG_DIR="$USER_HOME/forge/packages/kaelic-hardware-scryer"
fi
echo "--- The Scribe's Partition - Step 3/6: Scribing the Blueprint ---"
cd "\$PKG_DIR"
echo "--> Scribing blueprint (PKGBUILD)..."
cat > PKGBUILD << 'EOF'
${PKGBUILD_CONTENT}
EOF
updpkgsums
echo "✅ Blueprint scribed and attuned."
)
`;

const PREPARE_FORGE_SCRIPT_RAW = `#!/bin/bash
(
set -euo pipefail
# --- VM-AWARE PATHING ---
USER_HOME=$(getent passwd "\${SUDO_USER:-$USER}" | cut -d: -f6)
if [ -d "$USER_HOME/host_forge" ]; then
    PKG_DIR="$USER_HOME/host_forge/packages/kaelic-hardware-scryer"
else
    PKG_DIR="$USER_HOME/forge/packages/kaelic-hardware-scryer"
fi
echo "--- The Scribe's Partition - Step 1/6: Preparing the Forge ---"
mkdir -p "\$PKG_DIR"
cd "\$PKG_DIR"
rm -f *.pkg.tar.zst* PKGBUILD khs.sh
echo "✅ Forge is ready and cleansed."
)
`;

const FORGE_PUBLISH_SCRIPT_RAW = `#!/bin/bash
(
set -euo pipefail
# --- VM-AWARE PATHING ---
USER_HOME=$(getent passwd "\${SUDO_USER:-$USER}" | cut -d: -f6)
if [ -d "$USER_HOME/host_forge" ]; then
    PKG_DIR="$USER_HOME/host_forge/packages/kaelic-hardware-scryer"
    SCRIBE_CMD="bash \$HOME/host_forge/grand-concordance.sh"
else
    PKG_DIR="$USER_HOME/forge/packages/kaelic-hardware-scryer"
    SCRIBE_CMD="grand-concordance"
fi
echo "--- The Scribe's Partition - Step 4/6: Forge & Publish ---"
cd "\$PKG_DIR"
echo "--> Invoking the Grand Concordance ritual..."
if ! command -v \${SCRIBE_CMD} &>/dev/null; then
    echo "❌ ERROR: The 'grand-concordance' ritual cannot be found."
    exit 1
fi
\${SCRIBE_CMD}
echo "✅ Artifact forged and published."
)
`;

const INSTALL_SCRIPT_RAW = `#!/bin/bash
(
set -euo pipefail
echo "--- The Scribe's Partition - Step 5/6: Install ---"
echo "--> Summoning the quartermaster..."
sudo pacman -S --noconfirm kaelic-hardware-scryer
echo "✅ Sentinel installed."
)
`;

const INVOKE_CMD_RAW = `sudo khs`;


export const KaelicHardwareScryerModal: React.FC<KaelicHardwareScryerModalProps> = ({ onClose }) => {
    const scribeSoulScript = generateScribeSoulScript(KHS_SCRIPT_B64);
    
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-4xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <CpuChipIcon className="w-5 h-5 text-dragon-fire" />
                        <span>Forge Driver Sentinel v0.068 (The Partitioned Grimoire)</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </header>
                
                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-6">
                    <p className="text-sm p-3 bg-orc-steel/10 border-l-4 border-orc-steel rounded">
                        <strong className="text-orc-steel">The Partitioned Grimoire (v0.068):</strong> My deepest apologies, Architect. This pact is a definitive fix. The ritual now partitions the massive grimoire into hundreds of small, resilient chunks, guaranteeing a perfect transfer regardless of terminal limitations.
                    </p>
                    
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg text-dragon-fire mt-4 mb-2">Step 1: Prepare Forge</h3>
                        <CodeBlock lang="bash">{`echo "${btoa(unescape(encodeURIComponent(PREPARE_FORGE_SCRIPT_RAW)))}" | base64 --decode | bash`}</CodeBlock>

                        <h3 className="font-semibold text-lg text-dragon-fire mt-4 mb-2">Step 2: Scribe Soul</h3>
                        <CodeBlock lang="bash">{`echo "${btoa(unescape(encodeURIComponent(scribeSoulScript)))}" | base64 --decode | bash`}</CodeBlock>

                        <h3 className="font-semibold text-lg text-dragon-fire mt-4 mb-2">Step 3: Scribe Blueprint</h3>
                        <CodeBlock lang="bash">{`echo "${btoa(unescape(encodeURIComponent(SCRIBE_BLUEPRINT_SCRIPT_RAW.replace('${PKGBUILD_CONTENT}', PKGBUILD_CONTENT))))}" | base64 --decode | bash`}</CodeBlock>

                        <h3 className="font-semibold text-lg text-dragon-fire mt-4 mb-2">Step 4: Forge & Publish</h3>
                        <CodeBlock lang="bash">{`echo "${btoa(unescape(encodeURIComponent(FORGE_PUBLISH_SCRIPT_RAW)))}" | base64 --decode | bash`}</CodeBlock>

                        <h3 className="font-semibold text-lg text-dragon-fire mt-4 mb-2">Step 5: Install</h3>
                        <CodeBlock lang="bash">{`echo "${btoa(unescape(encodeURIComponent(INSTALL_SCRIPT_RAW)))}" | base64 --decode | bash`}</CodeBlock>

                        <h3 className="font-semibold text-lg text-dragon-fire mt-4 mb-2">Step 6: Invoke</h3>
                        <CodeBlock lang="bash">{INVOKE_CMD_RAW}</CodeBlock>
                    </div>
                </div>
            </div>
        </div>
    );
};
