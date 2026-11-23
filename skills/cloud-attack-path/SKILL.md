---
name: cloud-attack-path
description: "Bulut kontrol düzlemi saldırı yolları: AWS/Azure/GCP'de IAM privilege escalation, IMDS/managed identity token hırsızlığı, depolama ve cross-account trust istismarı ve kanıtı."
---
# Cloud Attack Paths (AWS / Azure / GCP)

## Amaç
`cloud-recon` salt-okunur durum tespiti yapar; bu skill **saldırı yolunu** yürütür: elde edilen düşük yetkili kimlikten yükselme, yatay hareket ve kanıt. Kontrol düzleminde yıkıcı değişiklik yapma; kanıtı tek nesneyle sınırla.

## AWS
```bash
pipx install cloudfox && cloudfox aws --profile <p> all-checks
pipx install pacu && pacu    # whoami, enum, privesc modülleri
enumerate-iam --access-key <AK> --secret-key <SK>
```
Yollar:
- **IAM privesc**: `iam:CreatePolicyVersion`, `iam:AttachUserPolicy`, `iam:PassRole` + `lambda:CreateFunction`/`ec2:RunInstances`, `iam:UpdateAssumeRolePolicy`, `sts:AssumeRole` zinciri. Pacu `privesc`/`iam__privesc_scan`.
- **IMDS**: SSRF veya komut çalıştırma → `http://169.254.169.254/latest/meta-data/iam/security-credentials/<role>` (IMDSv1). IMDSv2 ise token akışı.
- **S3**: public/ACL, `s3:GetObject` geniş, bucket policy `Principal:*`. Kanıt: tek nesne `head-object`/ilk 64 byte.
- **Lambda/ECS**: environment secrets, execution role, `UpdateFunctionCode` ile kod değişimi (yalnız geri alınabilir test).
- **Cross-account**: AssumeRole trust `Principal` genişliği, `ExternalId` yokluğu.
- **CloudTrail**: kapalı/tek bölge, log dosyası bucket'ına erişim.

## Azure
```bash
azurehound -u <user> -p '<pass>' list -o az.json   # BloodHound CE
```
- **Managed identity**: `IDENTITY_ENDPOINT` + `IDENTITY_HEADER` (App Service/Function) veya IMDS `http://169.254.169.254/metadata/identity/oauth2/token` → ARM/Graph token.
- **Contributor → Owner**: `Microsoft.Authorization/roleAssignments/write`, Automation Account runbook, Logic App, VM extension ile kod çalıştırma.
- **Key Vault**: erişim politikası/RBAC genişliği; tek secret `az keyvault secret show` (maskeli).
- **Storage**: public blob, SAS token sızıntısı, `listKeys`.
- **App registration**: secret/cert ekleme, `Directory.ReadWrite.All` (bkz. `entra-id-attack`).

## GCP
```bash
gcloud auth login / gcloud auth activate-service-account --key-file ...
scoutsuite gcproj / gcpbucketbrute.py
```
- **Metadata**: `http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token` (Header: `Metadata-Flavor: Google`).
- **SA impersonation**: `iam.serviceAccounts.actAs`, `getAccessToken`, `signJwt`; `gcloud auth print-access-token --impersonate-service-account`.
- **Bucket**: `storage.objects.list/get`, public `allUsers`.
- **Org policy** boşlukları: domain-restricted sharing kapalı, default SA'lar aktif, primitive roller.

## Impact kanıtı (L3/L4, salt-okunur)
```bash
aws sts get-caller-identity
aws s3 ls s3://<bucket> --max-items 5
aws s3api head-object --bucket <b> --key <one-key> --range bytes=0-63
az account show && az keyvault secret show --vault-name <v> --name <n> --query value -o tsv | cut -c1-8
gcloud config list && gcloud storage ls gs://<bucket> | head -3
```
Tek nesne/tek secret, değer maskeli. **Tüm bucket/secret indirme yok.** Rol değişikliği yaptıysan L4 ve geri alınması zorunlu.

## Temizlik
Oluşturulan IAM kullanıcı/rol/policy, AssumeRole trust değişikliği, test Lambda/VM, role assignment, SAS token, test secret → hepsini sil/döndür; CloudTrail/Activity Log üzerinden "önce/sonra" doğrula.

## Tespit hook'ları
AWS CloudTrail (`CreatePolicyVersion`, `PassRole`, `AssumeRole`, `GetSecretValue`), GuardDuty `UnauthorizedAccess:IAMUser`, Azure Activity Log (`roleAssignments/write`, `listKeys`), Entra sign-in, GCP Admin Activity audit (`SetIamPolicy`, `generateAccessToken`).
