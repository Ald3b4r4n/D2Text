// Aguarda o carregamento completo do DOM antes de executar o resto do código
document.addEventListener("DOMContentLoaded", function () {
  // =============================================
  // CONSTANTES DE CONFIGURAÇÃO
  // =============================================
  const MAX_FILE_SIZE_KB = 1024;
  const MAX_DIMENSION = 1200;
  const OCR_API_KEY = "K82112819888957";
  const OCR_TIMEOUT = 30000;

  // =============================================
  // INICIALIZAÇÃO E AUTENTICAÇÃO FIREBASE
  // =============================================
  const firebaseConfig = {
    apiKey: "Secret_var",
    authDomain: "abordagem-digital.firebaseapp.com",
    projectId: "abordagem-digital",
    storageBucket: "abordagem-digital.appspot.com",
    messagingSenderId: "600761255148",
    appId: "1:600761255148:web:10b455992c70ca42c391c9",
    measurementId: "G-QDHYDYZ044",
  };

  const fbApp = firebase.initializeApp(firebaseConfig);
  const fbAuth = firebase.auth();
  fbAuth.onAuthStateChanged((user) => {
    if (user) {
      const userInfo = document.getElementById("userInfo");
      if (userInfo) {
        userInfo.textContent = user.email;
      }
    } else {
      window.location.href = "index.html";
    }
  });
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      fbAuth
        .signOut()
        .then(() => {
          window.location.href = "index.html";
        })
        .catch((error) => {
          console.error("Erro ao fazer logout:", error);
        });
    });
  }

  // =============================================
  // ESTADO DA APLICAÇÃO
  // =============================================
  let currentFile = null;
  let ocrRawText = "";
  let currentCorrectionField = "";

  // =============================================
  // CACHE DE ELEMENTOS DOM
  // =============================================
  const elements = {
    fileInput: document.getElementById("fileInput"),
    cameraBtn: document.getElementById("cameraBtn"),
    galleryBtn: document.getElementById("galleryBtn"),
    preview: document.getElementById("preview"),
    previewSection: document.getElementById("previewSection"),
    processBtn: document.getElementById("processBtn"),
    processTextBtn: document.getElementById("processTextBtn"),
    fileSizeAlert: document.getElementById("fileSizeAlert"),
    sizeWarningText: document.getElementById("sizeWarningText"),
    compressProgress: document.getElementById("compressProgress"),
    progressBar: document.getElementById("progressBar"),
    fullText: document.getElementById("fullText"),
    copyBtn: document.getElementById("copyBtn"),
    whatsappBtn: document.getElementById("whatsappBtn"),
    resetAntecedentes: document.getElementById("resetAntecedentes"),
    resetLocal: document.getElementById("resetLocal"),

    resetEquipe: document.getElementById("resetEquipe"),
    abordado: document.getElementById("abordado"),
    genitora: document.getElementById("genitora"),
    apelido: document.getElementById("apelido"),
    cpf: document.getElementById("cpf"),
    dn: document.getElementById("dn"),
    antecedentes: document.getElementById("antecedentes"),
    endereco: document.getElementById("endereco"),
    local: document.getElementById("local"),
    equipe: document.getElementById("equipe"),
    tornozeleiraCheck: document.getElementById("tornozeleiraCheck"),
    naoAplicaTornozeleira: document.getElementById("naoAplicaTornozeleira"),
    tornozeleiraNumero: document.getElementById("tornozeleiraNumero"),
    veiculoCheck: document.getElementById("veiculoCheck"),
    naoAplicaVeiculo: document.getElementById("naoAplicaVeiculo"),
    veiculoPlaca: document.getElementById("veiculoPlaca"),
    veiculoCor: document.getElementById("veiculoCor"),
    veiculoModelo: document.getElementById("veiculoModelo"),
    inserirApelido: document.getElementById("inserirApelido"),
    naoAplicaApelido: document.getElementById("naoAplicaApelido"),

    correctionModal: new bootstrap.Modal(
      document.getElementById("correctionModal")
    ),
    modalFieldName: document.getElementById("modalFieldName"),
    ocrTextContent: document.getElementById("ocrTextContent"),
    extractionHintContent: document.getElementById("extractionHintContent"),
    startExpression: document.getElementById("startExpression"),
    endExpression: document.getElementById("endExpression"),
    resultPreview: document.getElementById("resultPreview"),
    manualInput: document.getElementById("manualInput"),
    applyCorrection: document.getElementById("applyCorrection"),
    cameraBtnAbordado: document.getElementById("cameraBtnAbordado"),
    galleryBtnAbordado: document.getElementById("galleryBtnAbordado"),
    fileInputAbordado: document.getElementById("fileInputAbordado"),
    previewAbordado: document.getElementById("previewAbordado"),
    previewSectionAbordado: document.getElementById("previewSectionAbordado"),
    whatsappInstructionsModal: new bootstrap.Modal(
      document.getElementById("whatsappInstructionsModal")
    ),
    continueToWhatsappBtn: document.getElementById("continueToWhatsapp"),
    dontShowAgainCheck: document.getElementById("dontShowAgain"),
    feedbackToast: new bootstrap.Toast(
      document.getElementById("feedbackToast")
    ),
    searchBnmpBtn: document.getElementById("searchBnmpBtn"),
    searchPlateBtn: document.getElementById("searchPlateBtn"),
    bnmpInfoModal: new bootstrap.Modal(
      document.getElementById("bnmpInfoModal")
    ),
    plateInfoModal: new bootstrap.Modal(
      document.getElementById("plateInfoModal")
    ),
    bnmpContinueLink: document.getElementById("bnmpContinueLink"),
    plateContinueLink: document.getElementById("plateContinueLink"),
  };
  const requiredFields = [
    "abordado",
    "genitora",
    "cpf",
    "dn",
    "antecedentes",
    "endereco",
    "local",
    "equipe",
  ];
  // =============================================
  // CONFIGURAÇÃO DE EVENT LISTENERS
  // =============================================
  elements.cameraBtn.addEventListener("click", () =>
    openFileSelector(elements.fileInput, "environment")
  );
  elements.galleryBtn.addEventListener("click", () =>
    openFileSelector(elements.fileInput)
  );
  elements.fileInput.addEventListener("change", handleFileSelect);
  elements.cameraBtnAbordado.addEventListener("click", () =>
    openFileSelector(elements.fileInputAbordado, "environment")
  );
  elements.galleryBtnAbordado.addEventListener("click", () =>
    openFileSelector(elements.fileInputAbordado)
  );
  elements.fileInputAbordado.addEventListener(
    "change",
    handleFileSelectAbordado
  );

  elements.processBtn.addEventListener("click", processDocument);
  elements.processTextBtn.addEventListener("click", processPastedText);
  elements.copyBtn.addEventListener("click", copyToClipboard);
  elements.whatsappBtn.addEventListener("click", handleWhatsAppClick);
  elements.continueToWhatsappBtn.addEventListener(
    "click",
    proceedWithWhatsAppShare
  );

  // Listener para detectar quando texto é digitado/colado no textarea
  elements.fullText.addEventListener("input", handleTextareaInput);

  elements.resetAntecedentes.addEventListener("click", () =>
    clearField("antecedentes")
  );
  elements.resetLocal.addEventListener("click", () => clearField("local"));
  elements.resetEquipe.addEventListener("click", () => clearField("equipe"));

  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      openCorrectionModal(this.getAttribute("data-field"));
    });
  });
  elements.applyCorrection.addEventListener("click", applyCorrectionValue);
  elements.startExpression.addEventListener("input", updateResultPreview);
  elements.endExpression.addEventListener("input", updateResultPreview);

  elements.searchBnmpBtn.addEventListener("click", () =>
    handleSinespSearch("bnmp")
  );
  elements.searchPlateBtn.addEventListener("click", () =>
    handleSinespSearch("plate")
  );

  requiredFields.forEach((id) => {
    elements[id].addEventListener("input", validateFormAndToggleActions);
  });

  // =============================================
  // NOVAS FUNÇÕES PARA PROCESSAMENTO DE TEXTO COLADO
  // =============================================

  /**
   * Detecta quando texto é colado ou digitado no textarea
   */
  function handleTextareaInput() {
    const textValue = elements.fullText.value.trim();

    // Mostra ou esconde o botão baseado se há texto suficiente
    if (textValue.length > 10) {
      // Requer pelo menos algum texto significativo
      elements.processTextBtn.classList.remove("d-none");
    } else {
      elements.processTextBtn.classList.add("d-none");
    }
  }

  /**
   * Processa o texto colado manualmente pelo usuário
   */
  function processPastedText() {
    const textValue = elements.fullText.value.trim();

    if (!textValue) {
      showAlert("Por favor, cole algum texto para processar.", "warning");
      return;
    }

    try {
      // Salva o texto colado como o texto OCR
      ocrRawText = textValue;

      // Extrai e preenche os campos do texto colado
      extractAndFillFields(textValue);

      // Torna os botões de edição visíveis
      document
        .querySelectorAll(".edit-btn")
        .forEach((el) => (el.style.visibility = "visible"));

      // Valida os campos do formulário
      validateFormAndToggleActions();

      showAlert("Texto processado com sucesso!", "success");

      // Esconde o botão após processar
      elements.processTextBtn.classList.add("d-none");
    } catch (error) {
      console.error("Erro no processamento do texto:", error);
      showAlert(`Erro no processamento do texto: ${error.message}.`, "danger");
    }
  }

  // =============================================
  // NOVAS MÁSCARAS DE FORMATAÇÃO AUTOMÁTICA
  // =============================================
  elements.cpf.addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, "").slice(0, 11);
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
    value = value.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
    e.target.value = value;
  });
  elements.dn.addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, "");
    value = value.replace(/(\d{2})(\d)/, "$1/$2");
    value = value.replace(/(\d{2})(\d)/, "$1/$2");
    e.target.value = value.slice(0, 10);
  });
  // =============================================
  // LÓGICA DE CHECKBOXES
  // =============================================
  function setupCheckboxPair(
    checkId,
    naoAplicaId,
    conditionalElementId,
    isInput,
    onCheckCallback = null
  ) {
    const check = document.getElementById(checkId);
    const naoAplica = document.getElementById(naoAplicaId);
    const conditionalElement = document.getElementById(conditionalElementId);

    const updateState = () => {
      const shouldShow = check.checked;
      if (conditionalElement) {
        if (isInput) {
          conditionalElement.disabled = !shouldShow;
          if (!shouldShow) conditionalElement.value = "";
        } else {
          conditionalElement.style.display = shouldShow ? "block" : "none";
        }
      }
    };
    check.addEventListener("change", () => {
      if (check.checked) naoAplica.checked = false;
      else naoAplica.checked = true;
      if (check.checked && onCheckCallback) onCheckCallback();
      updateState();
    });
    naoAplica.addEventListener("change", () => {
      if (naoAplica.checked) check.checked = false;
      else check.checked = true;
      updateState();
    });
    naoAplica.checked = true;
    check.checked = false;
    updateState();
  }

  const extractAndFillPlate = () => {
    if (ocrRawText) {
      const plateRegex = /([A-Z]{3}[- ]?\d{4}|[A-Z]{3}\d[A-Z]\d{2})/i;
      const match = ocrRawText.match(plateRegex);
      if (match && match[1]) {
        elements.veiculoPlaca.value = match[1]
          .toUpperCase()
          .trim()
          .replace(" ", "-");
      }
    }
  };

  setupCheckboxPair("inserirApelido", "naoAplicaApelido", "apelido", true);
  setupCheckboxPair(
    "tornozeleiraCheck",
    "naoAplicaTornozeleira",
    "tornozeleiraField",
    false
  );
  setupCheckboxPair(
    "veiculoCheck",
    "naoAplicaVeiculo",
    "veiculoFields",
    false,
    extractAndFillPlate
  );
  // =============================================
  // FUNÇÕES PRINCIPAIS
  // =============================================
  function validateFormAndToggleActions() {
    const isFormValid = requiredFields.every(
      (id) => elements[id].value.trim() !== ""
    );
    elements.copyBtn.disabled = !isFormValid;
    elements.whatsappBtn.disabled = !isFormValid;
  }

  function openFileSelector(inputElement, captureMode) {
    if (captureMode) inputElement.setAttribute("capture", captureMode);
    else inputElement.removeAttribute("capture");
    inputElement.click();
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    currentFile = file;
    const reader = new FileReader();
    reader.onload = (ev) => {
      elements.preview.src = ev.target.result;
      elements.previewSection.classList.remove("d-none");
      elements.processBtn.disabled = false;
      showAlert(
        `Imagem selecionada: ${(file.size / 1024 / 1024).toFixed(2)}MB.`,
        "info"
      );
    };
    reader.readAsDataURL(file);
  }

  function handleFileSelectAbordado(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      elements.previewAbordado.src = ev.target.result;
      elements.previewSectionAbordado.classList.remove("d-none");
    };
    reader.readAsDataURL(file);
  }

  async function processDocument() {
    if (!currentFile) return showAlert("Nenhum arquivo selecionado.", "danger");
    toggleProcessing(true);
    try {
      const processedFile = await processImageFile(currentFile);
      const base64Image = await fileToBase64(processedFile);
      const text = await callOcrSpaceApi(base64Image);
      showAlert("Documento processado com sucesso!", "success");
      ocrRawText = text;
      elements.fullText.value = text;
      extractAndFillFields(text);
      document
        .querySelectorAll(".edit-btn")
        .forEach((el) => (el.style.visibility = "visible"));
      validateFormAndToggleActions();

      // Esconde o botão de processar texto colado após OCR bem-sucedido
      elements.processTextBtn.classList.add("d-none");
    } catch (error) {
      console.error("Erro no processamento:", error);
      showAlert(
        `Erro no processamento: ${error.message}. Tente outra imagem.`,
        "danger"
      );
    } finally {
      toggleProcessing(false);
    }
  }

  async function callOcrSpaceApi(base64Image) {
    const formData = new FormData();
    formData.append("base64Image", `data:image/jpeg;base64,${base64Image}`);
    formData.append("language", "por");
    formData.append("OCREngine", "5");
    const response = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: { apikey: OCR_API_KEY },
      body: formData,
    });
    if (!response.ok) throw new Error(`Erro de rede: ${response.status}`);
    const data = await response.json();
    if (data.IsErroredOnProcessing) throw new Error(data.ErrorMessage[0]);
    if (!data.ParsedResults?.length)
      throw new Error("Nenhum texto reconhecido");
    return data.ParsedResults[0].ParsedText || "";
  }

  async function processImageFile(file) {
    if (file.size / 1024 <= MAX_FILE_SIZE_KB) return file;
    showAlert(`Otimizando imagem...`, "info");
    elements.compressProgress.classList.remove("d-none");
    try {
      updateProgress(30);
      const resizedImage = await resizeImage(
        file,
        MAX_DIMENSION,
        MAX_DIMENSION
      );
      updateProgress(60);
      const compressedImage = await compressToFileSize(
        resizedImage,
        MAX_FILE_SIZE_KB
      );
      updateProgress(100);
      return compressedImage;
    } finally {
      setTimeout(() => elements.compressProgress.classList.add("d-none"), 1000);
    }
  }

  // =============================================
  // FUNÇÕES DE EXTRAÇÃO E COMPARTILHAMENTO
  // =============================================

  function extractAndFillFields(text) {
    const findValue = (patterns) => {
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match.length > 1 && match[1]) {
          return match[1].replace(/\s+/g, " ").trim();
        }
      }
      return "";
    };

    const patterns = {
      abordado: [
        // Primeiro padrão - após a palavra "NOME"
        /(?:NOME(?: E SOBRENOME)?)[^\n]*\n([A-ZÀ-Ü]{2,}(?:\s+[A-ZÀ-Ü]{2,}){1,})/i,

        // Segundo padrão - nome seguido por data
        /(?:^|\n)([A-ZÀ-Ü]{2,}(?:\s+[A-ZÀ-Ü]{2,}){1,})\s*\n\s*\d{2}\/\d{2}\/\d{4}/i,

        // Adicionar padrão específico para CNH - linha "NOME E SOBRENOME"
        /2\s*e\s*1\s*NOME\s*E\s*SOBRENOME\s*\n([A-ZÀ-Ü]{2,}(?:\s+[A-ZÀ-Ü]{2,})+)/i,
      ],
      dn: [
        /(?:DATA NASC(?:IMENTO)?)[\s:.-]*(\d{2}\/\d{2}\/\d{4})/i,
        /\b(\d{2}\/\d{2}\/\d{4})\b/i,
      ],
      cpf: [
        /CPF\s*[:\n-]*\s*(\d{3}[.\s]?\d{3}[.\s]?\d{3}[-\s]?\d{2})/i,
        /\b(\d{11})\b/,
      ],
      veiculoPlaca: [
        /PLACA\s*[:\n-]*\s*([A-Z]{3}[- ]?\d{4})/i,
        /\b([A-Z]{3}\d[A-Z]\d{2})\b/i,
      ],
      veiculoCor: [/COR PREDOMINANTE\s+([A-ZÁ-Ú]+)/i],
      veiculoModelo: [/MARCA\/MODELO\/VERSAO\s+([^\n]+)/i],
    };

    const nome = findValue(patterns.abordado);
    elements.abordado.value = nome.split(" ").length >= 2 ? nome : "";
    elements.dn.value = findValue(patterns.dn);

    // CPF: normaliza e formata corretamente
    let cpfValue = findValue(patterns.cpf).replace(/\D/g, "");
    if (cpfValue.length === 11) {
      cpfValue = cpfValue.replace(
        /(\d{3})(\d{3})(\d{3})(\d{2})/,
        "$1.$2.$3-$4"
      );
    } else {
      cpfValue = "";
    }
    elements.cpf.value = cpfValue;

    // Genitora (mãe): extrai corretamente mesmo com quebra de linha
    // Genitora (mãe): extrai corretamente mesmo com quebra de linha
    let genitoraValue = "";
    const filiacaoMatch = text.match(
      /FILIA(?:C|Ç)ÃO\s*[:\n-]*([\s\S]{10,150})/i
    );
    if (filiacaoMatch && filiacaoMatch[1]) {
      const stopWords = [
        "PERMISSÃO",
        "CAT.",
        "N°",
        "VALIDADE",
        "HABILITAÇÃO",
        "BRANCA",
      ];
      const lines = filiacaoMatch[1]
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => /^[A-ZÀ-Ü\s]{5,}$/.test(l));

      const validLines = [];
      for (const line of lines) {
        if (stopWords.some((word) => line.includes(word))) break;
        validLines.push(line);
      }

      // Assume que a primeira linha é do pai e a(s) seguinte(s) da mãe
      if (validLines.length >= 2) {
        const nomeMae = validLines.slice(1).join(" ");
        genitoraValue = nomeMae.replace(/^\bSILVA\b\s*/i, "").trim(); // remove alguns padrões como "SILVA" no início, se houver
      } else if (validLines.length === 1) {
        genitoraValue = validLines[0].trim();
      }
    }
    elements.genitora.value = genitoraValue;

    // Veículo
    const placa = findValue(patterns.veiculoPlaca);
    const cor = findValue(patterns.veiculoCor);
    const modelo = findValue(patterns.veiculoModelo);
    if (placa || cor || modelo) {
      document.getElementById("veiculoCheck").checked = true;
      document.getElementById("naoAplicaVeiculo").checked = false;
      document.getElementById("veiculoFields").style.display = "block";
      elements.veiculoPlaca.value = placa;
      elements.veiculoCor.value = cor;
      elements.veiculoModelo.value = modelo;
    }
  }

  function generateReportText() {
    const getVal = (elId) => elements[elId].value.trim() || "Não informado";
    const apelidoFinal = elements.naoAplicaApelido.checked
      ? "Não se aplica"
      : getVal("apelido");
    let report =
      `🚨 *ABORDAGEM POLICIAL* 🚨\n\n` +
      `*Abordado:* ${getVal("abordado")}\n` +
      `*Genitora:* ${getVal("genitora")}\n` +
      `*Apelido:* ${apelidoFinal}\n` +
      `*CPF:* ${getVal("cpf")}\n` +
      `*Data Nasc.:* ${getVal("dn")}\n` +
      `*Endereço:* ${getVal("endereco")}\n` +
      `*Antecedentes:* ${getVal("antecedentes")}\n` +
      `*Local da Abordagem:* ${getVal("local")}\n` +
      `*Equipe:* ${getVal("equipe")}\n` +
      `*OBSERVAÇÕES:*\n`;
    report += elements.tornozeleiraCheck.checked
      ? `- Tornozeleira: Sim. Número: ${getVal("tornozeleiraNumero")}\n`
      : `- Tornozeleira: Não se aplica.\n`;
    report += elements.veiculoCheck.checked
      ? `- Veículo: Sim.\n  Placa: ${getVal("veiculoPlaca")}\n  Cor: ${getVal(
          "veiculoCor"
        )}\n  Modelo: ${getVal("veiculoModelo")}\n`
      : `- Veículo: Não se aplica.\n`;
    return report.trim();
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(generateReportText());
      showToast("Dados copiados para a área de transferência!");
    } catch (err) {
      showAlert("Erro ao copiar.", "danger");
    }
  }

  function handleWhatsAppClick() {
    if (!elements.fileInputAbordado.files[0]) {
      return showAlert(
        "É necessário adicionar uma foto do abordado para enviar via WhatsApp.",
        "warning"
      );
    }
    if (localStorage.getItem("showWhatsAppInstructions") !== "false") {
      elements.whatsappInstructionsModal.show();
    } else {
      proceedWithWhatsAppShare();
    }
  }

  async function proceedWithWhatsAppShare() {
    elements.whatsappInstructionsModal.hide();
    if (elements.dontShowAgainCheck.checked) {
      localStorage.setItem("showWhatsAppInstructions", "false");
    }
    const text = generateReportText();
    const abordadoFile = elements.fileInputAbordado.files[0];
    try {
      await navigator.clipboard.writeText(text);
      showToast("Texto do relatório copiado!");
      await navigator.share({
        files: [abordadoFile],
        title: "Relatório de Abordagem",
      });
    } catch (error) {
      if (error.name !== "AbortError") {
        showAlert(
          "Falha ao compartilhar. Enviando apenas o texto como alternativa.",
          "danger"
        );
        window.open(
          `https://wa.me/?text=${encodeURIComponent(text)}`,
          "_blank"
        );
      }
    }
  }

  // =============================================
  // FUNÇÕES DO MODAL DE CORREÇÃO
  // =============================================
  function openCorrectionModal(fieldId) {
    currentCorrectionField = fieldId;
    elements.modalFieldName.textContent =
      document.querySelector(`label[for="${fieldId}"]`)?.textContent ||
      document.querySelector(
        `label[for="${fieldId.replace("veiculo", "veiculoP")}"]`
      )?.textContent ||
      fieldId;
    elements.ocrTextContent.textContent =
      ocrRawText || "Nenhum texto OCR para exibir.";

    let hintHtml = "";
    switch (fieldId) {
      case "dn":
        hintHtml = `<ul class="mb-0 mt-2 small">
          <li>Para extrair uma data, use <code>Início: "NASCIMENTO"</code> e <code>Fim: "ASSINATURA"</code>.</li>
          <li>O formato esperado é <strong>DD/MM/AAAA</strong>.</li>
        </ul>`;
        break;
      case "cpf":
        hintHtml = `<ul class="mb-0 mt-2 small">
          <li>O CPF pode ser extraído usando <code>Início: "CPF"</code>.</li>
          <li>O formato esperado é <strong>000.000.000-00</strong>.</li>
        </ul>`;
        break;
      case "veiculoPlaca":
        hintHtml = `<ul class="mb-0 mt-2 small">
            <li>Use a extração para capturar a placa de dentro do texto.</li>
            <li>O formato Mercosul (ABC1D23) ou antigo (ABC-1234) são aceitos.</li>
        </ul>`;
        break;
      default:
        hintHtml = `<ul class="mb-0 mt-2 small">
            <li>O texto que você digitar em <strong>"Extrair após"</strong> será o <strong>início</strong> do resultado (inclusivo).</li>
            <li>O texto em <strong>"Extrair antes de"</strong> será o <strong>fim</strong> do resultado (inclusivo).</li>
            <li><strong>Exemplo:</strong> Para extrair "JOMARETE PEIXOTO SILVA", use <code>Início: "JOMARETE"</code> e <code>Fim: "SILVA"</code>.</li>
          </ul>`;
    }
    elements.extractionHintContent.innerHTML = hintHtml;

    [
      "startExpression",
      "endExpression",
      "resultPreview",
      "manualInput",
    ].forEach((id) => (elements[id].value = ""));
    elements.correctionModal.show();
  }

  function updateResultPreview() {
    const start = elements.startExpression.value;
    const end = elements.endExpression.value;
    const text = ocrRawText;

    // Se o campo de início estiver vazio, não há como ancorar a busca.
    if (!start) {
      elements.resultPreview.value = "";
      return;
    }

    const lowerCaseText = text.toLowerCase();
    const lowerCaseStart = start.toLowerCase();

    // 1. Encontra o índice inicial da string de início.
    const startIndex = lowerCaseText.indexOf(lowerCaseStart);
    // Se a string de início não for encontrada, não há resultado.
    if (startIndex === -1) {
      elements.resultPreview.value = "";
      return;
    }

    let finalEndIndex;
    // 2. Se uma string de fim foi fornecida, procure por ela.
    if (end) {
      const lowerCaseEnd = end.toLowerCase();
      // Procura a string de fim a partir da posição onde a string de início foi encontrada.
      const endIndex = lowerCaseText.indexOf(lowerCaseEnd, startIndex);

      if (endIndex !== -1) {
        // Se encontrou, o ponto final da extração é o final da string de fim.
        finalEndIndex = endIndex + end.length;
      } else {
        // Se não encontrou a string de fim, extrai do início até o final do texto.
        finalEndIndex = text.length;
      }
    } else {
      // 3. Se nenhuma string de fim foi fornecida, extrai do início até o final do texto.
      finalEndIndex = text.length;
    }

    // 4. Extrai a substring do texto original e exibe no preview.
    elements.resultPreview.value = text
      .substring(startIndex, finalEndIndex)
      .trim();
  }

  function applyCorrectionValue() {
    const val = elements.manualInput.value || elements.resultPreview.value;
    if (val && elements[currentCorrectionField]) {
      elements[currentCorrectionField].value = val;
      validateFormAndToggleActions();
    }
    elements.correctionModal.hide();
  }

  // =============================================
  // LÓGICA SINESP CIDADÃO
  // =============================================
  function handleSinespSearch(type) {
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);
    const appStoreUrl =
      "https://apps.apple.com/br/app/sinesp-cidad%C3%A3o/id767499333";
    const playStoreUrl =
      "https://play.google.com/store/apps/details?id=br.gov.sinesp.cidadao.android";
    const packageName = "br.gov.sinesp.cidadao.android";

    let value,
      deepLinkBase,
      intentPath,
      modal,
      linkElement,
      storeUrl,
      storeName;

    if (type === "bnmp") {
      value = elements.abordado.value.trim();
      if (!value) return showToast("Preencha o campo 'Abordado'.");
      deepLinkBase = `sinesp-cidadao://mandados/consultar?nome=${encodeURIComponent(
        value
      )}`;
      intentPath = `#Intent;scheme=sinesp-cidadao;package=${packageName};S.browser_fallback_url=${encodeURIComponent(
        playStoreUrl
      )};end`;
      modal = elements.bnmpInfoModal;
      linkElement = elements.bnmpContinueLink;
    } else {
      // plate
      value = elements.veiculoPlaca.value.trim().replace(/[^a-zA-Z0-9]/g, "");
      if (!value) return showToast("Preencha o campo 'Placa'.");
      deepLinkBase = `sinesp-cidadao://veiculos/consultar?placa=${value}`;
      intentPath = `#Intent;scheme=sinesp-cidadao;package=${packageName};S.browser_fallback_url=${encodeURIComponent(
        playStoreUrl
      )};end`;
      modal = elements.plateInfoModal;
      linkElement = elements.plateContinueLink;
    }

    if (isIOS || isAndroid) {
      if (isIOS) {
        storeUrl = appStoreUrl;
        storeName = "App Store";
      } else {
        storeUrl = playStoreUrl;
        storeName = "Play Store";
      }

      // Atualiza o nome da loja de aplicativos no modal
      const storeNameElement = modal._element.querySelector(".app-store-name");
      if (storeNameElement) {
        storeNameElement.textContent = storeName;
      }

      // Define a ação do botão "Continuar"
      linkElement.onclick = (e) => {
        e.preventDefault();

        if (isIOS) {
          window.location.href = deepLinkBase;
          setTimeout(() => {
            window.location.href = storeUrl;
          }, 2500);
        } else {
          // isAndroid
          window.location.href = `intent://${
            deepLinkBase.split("://")[1]
          }${intentPath}`;
        }
      };

      modal.show();
    } else {
      // Fallback para desktop
      window.open(playStoreUrl, "_blank");
    }
  }

  // =============================================
  // FUNÇÕES AUXILIARES
  // =============================================
  function clearField(fieldId) {
    if (elements[fieldId]) elements[fieldId].value = "";
    validateFormAndToggleActions();
  }

  function toggleProcessing(isProcessing) {
    elements.processBtn.disabled = isProcessing;
    elements.processBtn.innerHTML = isProcessing
      ? `<span class="spinner-border spinner-border-sm"></span> Processando...`
      : `<i class="bi bi-gear"></i> Processar Documento`;
  }

  function showAlert(message, type = "info") {
    elements.fileSizeAlert.className = `alert alert-${type}`;
    elements.sizeWarningText.textContent = message;
    elements.fileSizeAlert.classList.remove("d-none");
  }

  function showToast(message) {
    const toastBody =
      elements.feedbackToast._element.querySelector(".toast-body");
    if (toastBody) toastBody.textContent = message;
    elements.feedbackToast.show();
  }

  function updateProgress(percent) {
    elements.progressBar.style.width = `${percent}%`;
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = (error) =>
        reject(new Error("Falha ao converter para Base64"));
      reader.readAsDataURL(file);
    });
  }

  // =============================================
  // FUNÇÕES DE PROCESSAMENTO DE IMAGEM
  // =============================================
  function resizeImage(file, maxWidth, maxHeight) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Falha ao criar blob"));

            resolve(
              new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              })
            );
          },
          "image/jpeg",
          0.9
        );
      };
      img.onerror = () => reject(new Error("Falha ao carregar imagem"));
      img.src = URL.createObjectURL(file);
    });
  }

  function compressToFileSize(file, maxSizeKB) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = img.width;

          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          let quality = 0.9;
          const compress = () => {
            canvas.toBlob(
              (blob) => {
                if (blob.size / 1024 <= maxSizeKB || quality <= 0.1) {
                  resolve(
                    new File([blob], file.name, {
                      type: "image/jpeg",
                      lastModified: Date.now(),
                    })
                  );
                } else {
                  quality -= 0.1;
                  compress();
                }
              },
              "image/jpeg",
              quality
            );
          };
          compress();
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  validateFormAndToggleActions();
});
