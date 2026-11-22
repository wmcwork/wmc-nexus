# WMC NEXUS'u Windows'ta çalıştırma (Docker olmadan)

Bu kaynak kod derlemesi web arayüzünü ve Go arka ucunu yerel olarak çalıştırır. PostgreSQL
gereklidir; Docker gerekmez.

## Gereksinimler

- Windows 10 veya 11
- Go 1.26.10 veya üzeri
- Node.js 22 veya üzeri (npm dahildir)
- Çalışır durumda yerel PostgreSQL 16 ve WMC NEXUS için boş bir veritabanı/kullanıcı

Veritabanı şeması PostgreSQL'e özgü özellikler kullanır. SQLite yalnızca yerel trafik
indekslemesinde kullanılır; ana PostgreSQL veritabanının yerine geçmez.

## Derleme ve çalıştırma

1. PostgreSQL'i kurup uygulama için bir veritabanı ve kullanıcı oluşturun. Parolayı gizli tutun;
   depoya eklemeyin.
2. Proje klasöründe PowerShell açın.
3. Şunu çalıştırın:

   ```powershell
   .\install-windows.ps1
   ```

   Betik ön uç bağımlılıklarını kilit dosyasından kurar, statik arayüzü ve Windows çalıştırılabilir
   dosyasını derler, ardından PostgreSQL DSN bilgisini güvenli şekilde ister. PostgreSQL'i kurmaz
   ve DSN bilgisini proje dosyasına yazmaz.

   Uygulamayı başlatmadan yalnızca derlemek için:

   ```powershell
   .\install-windows.ps1 -BuildOnly
   ```

4. İlk başlatmada konsolda gösterilen tek kullanımlık kurulum anahtarını kopyalayın ve tarayıcıda
   `http://127.0.0.1:8787` adresini açın. Hizmet varsayılan olarak yalnızca yerel döngü adresinde
   dinler.

Yerel veritabanı için DSN biçimi genellikle şöyledir:

```text
postgres://KULLANICI:PAROLA@127.0.0.1:5432/VERITABANI?sslmode=disable
```

Kullanıcı adı veya paroladaki özel karakterleri URL kodlamasıyla yazın. Geçerli PowerShell
oturumunda `ARTEX_PG_DSN` zaten tanımlıysa betik bu değeri kullanır ve yeniden sormaz.

## Veriler ve lisans

Uygulama verileri ve oluşturulan anahtarlar, proje dizinindeki veri/anahtar klasörlerinde tutulur.
Derlemeyi taşımadan veya değiştirmeden önce yedek alın. Proje ARTEX'ten türetilmiştir; yeniden
dağıtırken üst projenin lisansını ve bildirimlerini koruyun.
