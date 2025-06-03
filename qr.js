/**
 * Inicia a leitura do QR Code usando Html5Qrcode.
 * Retorna uma Promise que resolve com o texto lido ou rejeita em caso de erro/cancelamento.
 * Adiciona um botão de cancelar leitura.
 */
export function scanQRCode() {
  return new Promise((resolve, reject) => {
    const qrContainer = document.getElementById("leitor-qr");
    if (!qrContainer) {
      reject("Elemento leitor-qr não encontrado.");
      return;
    }

    // Limpa o container e adiciona botão cancelar
    qrContainer.innerHTML = "";
    const btnCancelar = document.createElement("button");
    btnCancelar.textContent = "Cancelar";
    btnCancelar.style.marginTop = "10px";
    qrContainer.appendChild(btnCancelar);

    const html5QrCode = new Html5Qrcode("leitor-qr");
    const config = { fps: 10, qrbox: 250 };

    let leituraAtiva = true;

    html5QrCode.start(
      { facingMode: "environment" },
      config,
      (decodedText) => {
        if (!leituraAtiva) return;
        leituraAtiva = false;
        html5QrCode.stop().then(() => {
          qrContainer.innerHTML = "";
          resolve(decodedText);
        });
      },
      (errorMessage) => {
        // Ignora erros de leitura contínua
      }
    ).catch(err => {
      qrContainer.innerHTML = "";
      reject("Erro ao iniciar a câmara: " + err);
    });

    btnCancelar.onclick = () => {
      if (!leituraAtiva) return;
      leituraAtiva = false;
      html5QrCode.stop().then(() => {
        qrContainer.innerHTML = "";
        reject("Leitura cancelada pelo utilizador.");
      });
    };
  });
}