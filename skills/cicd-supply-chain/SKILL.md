---
name: cicd-supply-chain
description: "CI/CD ve yazılım tedarik zinciri saldırıları: GitHub Actions/GitLab pipeline abuse, secret sızıntısı, OIDC trust, dependency confusion ve artifact poisoning ile impact kanıtı."
---
# CI/CD & Supply Chain Security

## Amaç
Pipeline üzerinden kod/secrets/cloud erişimi ele geçirme zincirini kurmak ve kanıtlamak. `codeaudit` ile kaynak analizini, `cloud-attack-path` ile OIDC sonrası bulut erişimini birleştir.

## 1) Yüzey keşfi
```bash
# GitHub Actions saldırı yüzeyi
gato enumerate --repository owner/repo
gato search --repository owner/repo --workflow "pull_request_target"
gato enumerate --org <org>
# secret taraması
trufflehog git https://github.com/owner/repo --only-verified
gitleaks detect --source . -v
```
Topla: workflow tetikleyicileri, `permissions:`, `pull_request_target`, `workflow_run`, `issue_comment`, `self-hosted`, `secrets.*` kullanımı, OIDC (`id-token: write`), third-party action'lar (tag/SHA pinlenmiş mi), artifact upload/download akışı.

## 2) GitHub Actions abuse sınıfları
- **`pull_request_target` + PR head checkout**: fork PR'ı base bağlamda çalışır, secret'lara erişir. PoC: fork'ta zararsız bir `echo`/DNS callback; secret değerini yazdırma, yalnız varlığını doğrula.
- **Script injection**: `${{ github.event.issue.title }}`, `github.event.pull_request.body`, branch adı → `run:` içine enjeksiyon.
- **`workflow_run` zinciri**: ayrıcalıklı workflow'un artifact'ını zehirleme (artifact poisoning).
- **Self-hosted runner**: kalıcılık, diğer job'ların workspace/secret'ları, ağ erişimi, `docker.sock`.
- **GITHUB_TOKEN yetkileri**: `contents: write`, `packages: write`, `actions: write` → tag/release/paket manipülasyonu.
- **OIDC → cloud**: `id-token: write` + `aws-actions/configure-aws-credentials` → rol varsayımı; subject/audience kısıtı zayıfsa repo dışından da geçer.
- **Cache poisoning**: aynı key ile cache yaz → sonraki güvenilir build'e kod sok.
- **Environment approval bypass**: `environment` korumalı ama fork/PR yolu açıksa.

## 3) Secret ve artifact
- Log/artifact içinde secret: `ACTIONS_STEP_DEBUG`, `set -x`, `env`, hata çıktısı, junit/coverage dosyaları.
- Fork PR'da secret'a erişim var mı; `pull_request` vs `pull_request_target` farkı.
- Artifact: build çıktısı imzasız mı, sonraki job doğrulamadan mı kullanıyor.
- Kanıt: yakalanan değeri **maskeyle** raporla (`AKIA…` ilk 4 + uzunluk), değeri dışarı sızdırma; canary kullan.

## 4) Tedarik zinciri
- **Dependency confusion**: iç paket adını public registry'de daha yüksek sürümle yayınla (yalnız yetkili/lab registry'de).
- **Typosquat / postinstall**: `npm install`/`pip install` sırasında çalışan script.
- **Action pinleme**: `@v3` yerine SHA; eski tag'lerin taşınabilirliği.
- **Submodule / lockfile poisoning**, imzasız release, `--no-verify`/`--ignore-scripts` farkları.

## 5) Impact kanıtı (L3/L4)
- Pipeline'dan **tek** bir secret'ın okunabildiğini göster (maskeli) veya OIDC ile bulutta tek bir `sts get-caller-identity`/`gcloud config list` çıktısı.
- Runner'da yalnız kanıt dosyası (`/tmp/ci-proof-<id>.txt`) oluştur; üretim verisi çekme, kod değiştirme, kalıcılık kurma.
- PoE: yalnız hata/uyarı → L1; yapısal manipülasyon → L2; gerçek secret/rol → L3; dağıtım hattına yazma → L4.

## 6) Temizlik
Oluşturulan branch/PR/fork/artifact/cache kayıtlarını sil, test secret'ları döndür, runner'daki geçici dosyaları kaldır, yayınlanan test paketini unpublish et.

## Remediation
Action'ları SHA ile pinle, `permissions:` en az yetki, fork PR'da secret yok, `pull_request_target`'ta head checkout yok, OIDC subject/audience sıkı, self-hosted izole/ephemeral, artifact imzalama (Sigstore), secret scanning + push protection.
