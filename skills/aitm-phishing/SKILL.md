---
name: aitm-phishing
description: "AiTM / ters-proxy phishing ve MFA bypass: Evilginx3 + Gophish ile altyapı, phishlet, oturum çerezi ele geçirme, kampanya ölçümü ve teardown."
---
# AiTM Phishing & MFA Bypass

## Amaç
Ters-proxy (adversary-in-the-middle) phishing ile kimlik bilgisi **ve oturum çerezini** ele geçirip MFA'yı atlatmak; kampanyayı ölçmek (tıklama, kimlik girme, MFA bypass, bildirim süresi) ve izleri temizlemek. Mevcut `phishing-simulation` skill'i politika/ölçüm çerçevesini verir; bu skill teknik altyapıyı verir.

## Altyapı
- Domain (yaşlı, kategorize edilmiş), VPS, DNS A/AAAA, TLS sertifikası (Let's Encrypt), Cloudflare arkasında.
- Evilginx3 (veya v2) + Gophish (kampanya/SMTP) + opsiyonel Modlishka.
```bash
git clone https://github.com/kgretzky/evilginx2 && cd evilginx2 && make
# v3: lisans/derleme akışına uy; konfig: /root/.evilginx/config.json
evilginx -p ./phishlets
```
- Phishlet: hedef IdP'ye göre `proxy_hosts`, `sub_filters`, `auth_urls`, `credentials`, `session cookies` alanları. Yeni phishlet yazarken login POST'unu ve `Set-Cookie` başlıklarını Burp ile doğrula.

## Kampanya akışı
1. **Hedef kitle listesi** — yalnız mutabık kalınan kişiler; PII minimum.
2. **Lure**: `lures create <phishlet>`, `lures edit <id> redirect_url https://<gerçek-site>`, `lures get-url <id>`.
3. **Gönderim**: Gophish kampanyası; SPF/DKIM/DMARC yapılandır, yeni domainde warmup, link rewriting ve sandbox davranışını not et.
4. **Yakalama**: Evilginx oturumları (`sessions`, `lures`); çerezler + kullanıcı/şifre. Çerezleri tarayıcıya aktarıp (DevTools → Application → Cookies) **MFA atlatıldı mı** doğrula. Token binding / bound session varsa çerez replay başarısız olur — bunu sonuç olarak yaz.
5. **Doğrulama**: Ele geçen oturumla yalnız hedef hesabın kendi profiline eriş (`/me`), başka veri çekme. Kanıt: ekran görüntüsü + HTTP 200 + kullanıcı adı; çerez değerleri maskelenir.

## Ölçüm
Topla: gönderilen, teslim, açılma, tıklama, kimlik girme, MFA bypass, ilk bildirim süresi, bildiren kullanıcı oranı. MFA türüne göre kırılabilirlik: SMS/TOTP kırılır, number matching kısmen, FIDO2/passkey kırılmaz.

## Veri işleme
Ele geçen kimlik bilgisi/çerezleri şifreli sakla, kampanya sonunda sil; raporda maskele. Kurban hesabında oturum açtıysan `Revoke sessions` gerektiğini rapora yaz.

## Teardown
DNS kayıtlarını sil, sertifikayı iptal et, VPS'i imha et, Evilginx/Gophish veritabanlarını (`gophish.db`, evilginx `sessions`) güvenli sil, phishlet dosyalarını kaldır. Artefakt envanterini `opsec-and-cleanup` ile eşleştir.

## Email kontrol testleri
SPF/DKIM/DMARC hizalaması, link rewriting/ATP, ek sandbox, dış gönderen banner'ı, DMARC `p=reject` etkisi. Sonuçları "kontrol çalıştı/çalışmadı" olarak tablola.

## Tespit hook'ları
Yeni domain/DNS kaydı, ters-proxy TLS fingerprint, IdP sign-in log'unda olağandışı IP/ASN, `AADSTS` hataları, kullanıcı raporları, mail gateway log'ları.
