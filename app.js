// Aguarda o carregamento completo do DOM antes de executar o resto do código
document.addEventListener("DOMContentLoaded", function () {
  // =============================================
  // CONSTANTES DE CONFIGURAÇÃO
  // =============================================
  const MAX_FILE_SIZE_KB = 1024;
  const MAX_DIMENSION = 1200;
  const OCR_API_KEY = "K82112819888957";
  const OCR_TIMEOUT = 10000; // 10 segundos para timeout da OCR

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
    naturalidade: document.getElementById("naturalidade"),
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
    ocrTimeoutModal: new bootstrap.Modal(
      document.getElementById("ocrTimeoutModal")
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

    let timeoutId;
    let isTimedOut = false;

    try {
      // Criar uma promise para o timeout
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          isTimedOut = true;
          elements.ocrTimeoutModal.show(); // Mostrar o modal de timeout
          reject(new Error("OCR demorou muito tempo para responder"));
        }, OCR_TIMEOUT);
      });

      // Criar uma promise para a chamada da API
      const fetchPromise = fetch("https://api.ocr.space/parse/image", {
        method: "POST",
        headers: { apikey: OCR_API_KEY },
        body: formData,
      });

      // Usar Promise.race para ver qual promise resolve primeiro
      const response = await Promise.race([fetchPromise, timeoutPromise]);

      // Se chegou aqui, a API respondeu antes do timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (!response.ok) throw new Error(`Erro de rede: ${response.status}`);
      const data = await response.json();
      if (data.IsErroredOnProcessing) throw new Error(data.ErrorMessage[0]);
      if (!data.ParsedResults?.length)
        throw new Error("Nenhum texto reconhecido");

      return data.ParsedResults[0].ParsedText || "";
    } catch (error) {
      // Se o erro não for de timeout, limpar o timeout
      if (!isTimedOut && timeoutId) {
        clearTimeout(timeoutId);
      }
      throw error;
    }
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
    // Helpers
    const toLines = (t) =>
      t
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

    const normalizeSpaces = (s) => s.replace(/\s+/g, " ").trim();

    const UPPER = (s) => s.toUpperCase();

    const isAllCaps = (s) => /^[A-ZÀ-Ü\s./-]+$/.test(s);

    const stopWordsMae = [
      "PERMISSÃO",
      "ACC",
      "REGISTRO",
      "VALIDADE",
      "CATEGORIA",
      "RENAVAM",
      "PLACA",
      "HABILITAÇÃO",
      "NACIONAL",
      "EXERCÍCIO",
      "ASSINATURA",
      "DETRAN",
      "MARCA",
      "MODELO",
      "VERSÃO",
      "CHASSI",
      "COMBUSTÍVEL",
      "COR",
      "CÓDIGO",
      "ESPÉCIE",
      "TIPO",
      "LOCAL",
    ];

    const looksLikeName = (s) => {
      if (!s) return false;
      if (!isAllCaps(s)) return false; // OCR aqui está em caps
      if (/\d/.test(s)) return false; // nomes não têm dígitos
      const parts = s.split(/\s+/).filter(Boolean);
      if (parts.length < 2) return false; // pelo menos 2 termos
      if (stopWordsMae.some((w) => s.includes(w))) return false;
      // evita capturar rótulos curtos
      if (s.length < 5) return false;
      return true;
    };

    // Pré-processamento em maiúsculas e linhas
    const rawLines = toLines(text);
    const linhas = rawLines.map((l) => UPPER(l));

    // Campos principais
    let nome = "",
      mae = "",
      cpf = "",
      dn = "",
      placa = "";
    let emissao = "",
      validade = "",
      categoria = "";
    let naturalidade = "";

    // Dados de veículo
    let modelo = "",
      cor = "",
      combustivel = "",
      chassi = "";
    let anoModelo = "",
      anoFabricacao = "",
      nomeProprietario = "",
      cpfProprietario = "",
      emissaoVeiculo = "";

    // Passo 1: Heurística linha a linha (com proteções contra sobrescrita)
    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i];

      // NOME (não sobrescrever, e evitar pegar rótulos/linhas ruins)
      if ((linha.includes("NOME") || linha.includes("NAME")) && !nome) {
        const candidato1 = linhas[i + 1];
        const candidato2 = linhas[i + 2];

        const possiveis = [candidato1, candidato2];

        for (const candidato of possiveis) {
          if (
            candidato &&
            candidato.split(" ").length >= 2 &&
            !candidato.includes("HABILITAÇÃO") &&
            !/\d/.test(candidato)
          ) {
            nome = normalizeSpaces(candidato);
            break;
          }
        }
      }

      // Naturalidade
      if (!naturalidade) {
        // Caso 1: linha com palavras-chave explícitas
        if (
          linha.includes("NATURALIDADE") ||
          linha.includes("NATURAL DE") ||
          linha.includes("LOCAL DE NASCIMENTO")
        ) {
          const prox = linhas[i + 1];
          if (prox && prox.length > 2 && !/\d/.test(prox)) {
            naturalidade = normalizeSpaces(prox);
          } else {
            const match = linha.match(
              /(?:NATURALIDADE|LOCAL\s+DE\s+NASCIMENTO)[^\n:]*[:]*\s*([A-ZÀ-Ú\s\/-]+)/i
            );
            if (match && match[1]) naturalidade = normalizeSpaces(match[1]);
          }
        }

        // Caso 2: linha com "DATA, LOCAL E UF DE NASCIMENTO"
        if (
          linha.includes("DATA") &&
          linha.includes("LOCAL") &&
          linha.includes("UF") &&
          linha.includes("NASC")
        ) {
          const prox = linhas[i + 1];
          if (prox) {
            const match = prox.match(
              /(\d{2}\/\d{2}\/\d{4}),\s*([A-ZÀ-Ú\s]+),\s*([A-Z]{2})/i
            );
            if (match && match[2] && match[3]) {
              naturalidade = normalizeSpaces(match[2] + ", " + match[3]);
            }
          }
        }
      }

      // NOVA LÓGICA PARA EXTRAIR NOME DA MÃE
      // Verifica se a linha atual contém indicação de filiação
      const isFiliationLine = (line) => {
        return /[-\s]*([C\s]*)?(FILIA[CÇ]ÃO|FILIA[CÇ]?A?O|FILA[CÇ]ÃO|FIL[IAÇÃ]*|GENITORA|MOTHER|MAE|MÃE)/i.test(
          line
        );
      };

      if (isFiliationLine(linha) && !mae) {
        // Coleta linhas próximas que podem conter nomes
        const possibleNames = [];
        let j = i + 1;
        let maxLines = 10; // Procura mais linhas para garantir

        while (j < linhas.length && maxLines > 0) {
          const currentLine = linhas[j].trim();

          // Verifica se chegou ao fim da seção de filiação
          if (
            currentLine.length <= 2 ||
            /[*_]/.test(currentLine) ||
            /\d{2,}/.test(currentLine) || // Evita capturar linhas com muitos números
            stopWordsMae.some((w) => currentLine.includes(w))
          ) {
            break;
          }

          // Verifica se a linha parece um nome válido
          if (
            isAllCaps(currentLine) &&
            !currentLine.includes("FILIAÇÃO") &&
            currentLine.length > 3 &&
            currentLine.split(/\s+/).length >= 2
          ) {
            possibleNames.push(normalizeSpaces(currentLine));
          }

          j++;
          maxLines--;
        }

        // Determina o nome da mãe baseado nos nomes encontrados
        if (possibleNames.length >= 2) {
          // Geralmente o pai vem primeiro, a mãe depois
          mae = possibleNames[1]; // Segunda linha como mãe

          // Se tiver mais de 2 nomes, pode ser que a mãe seja a combinação de linhas adicionais
          if (possibleNames.length > 2) {
            // Verifica se a 3ª linha parece continuação do nome da mãe
            // (geralmente não tem o mesmo início que o nome do pai)
            const paiParts = possibleNames[0].split(/\s+/);
            const potencialMaeParts = possibleNames[2].split(/\s+/);

            if (paiParts[0] !== potencialMaeParts[0]) {
              // Se o primeiro nome for diferente, provavelmente é continuação do nome da mãe
              mae = normalizeSpaces(possibleNames[1] + " " + possibleNames[2]);
            }
          }
        } else if (possibleNames.length === 1) {
          mae = possibleNames[0]; // Se só encontrou um nome, assume que é da mãe
        }
      }

      // CPF com marcador
      if (!cpf && (linha.includes("CPF") || linha.includes("TAX ID"))) {
        const candidato = linhas[i + 1]?.replace(/\D/g, "");
        if (candidato?.length === 11) {
          cpf = `${candidato.slice(0, 3)}.${candidato.slice(
            3,
            6
          )}.${candidato.slice(6, 9)}-${candidato.slice(9)}`;
        }
      }

      // CPF genérico (sem marcador)
      if (!cpf) {
        const matchCpf = linha.match(
          /\b\d{3}[.\s]?\d{3}[.\s]?\d{3}[-\s]?\d{2}\b/
        );
        if (matchCpf) {
          const digits = matchCpf[0].replace(/\D/g, "");
          if (digits.length === 11) {
            cpf = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(
              6,
              9
            )}-${digits.slice(9)}`;
          }
        }
      }

      // Data de nascimento (janela ao redor do marcador)
      if (!dn && linha.includes("NASC")) {
        const janela = linhas.slice(i, i + 4).join(" ");
        const match = janela.match(/\b\d{2}\/\d{2}\/\d{4}\b/);
        if (match) dn = match[0];
      }

      // Data de emissão (CNH)
      if (!emissao && linha.includes("EMISS")) {
        const prox = linhas[i + 1];
        if (prox && /^\d{2}\/\d{2}\/\d{4}$/.test(prox)) {
          emissao = prox;
        } else {
          const m = linha.match(/\b\d{2}\/\d{2}\/\d{4}\b/);
          if (m) emissao = m[0];
        }
      }

      // Validade
      if (!validade && linha.includes("VALIDADE")) {
        const m = linha.match(/\b\d{2}\/\d{2}\/\d{4}\b/);
        if (m) validade = m[0];
        const prox = linhas[i + 1];
        if (!validade && prox && /^\d{2}\/\d{2}\/\d{4}$/.test(prox))
          validade = prox;
      }

      // Categoria de habilitação
      if (!categoria && linha.includes("CAT") && linha.includes("HAB")) {
        const partes = linha.split(/\s+/);
        const cat = partes.find((p) => /^[A-Z]{1,2}$/.test(p));
        if (cat) categoria = cat;
        if (!categoria && linhas[i + 1] && /^[A-Z]{1,2}$/.test(linhas[i + 1])) {
          categoria = linhas[i + 1];
        }
      }

      // Placa (ABCD Mercosul ou antigo)
      if (!placa) {
        const m = linha
          .replace(/\s+/g, "")
          .match(/\b[A-Z]{3}\d{4}\b|\b[A-Z]{3}\d[A-Z]\d{2}\b/);
        if (m) placa = m[0];
      }

      // Marca / Modelo (limpa caracteres estranhos)
      if (
        !modelo &&
        (linha.includes("MARCA") ||
          linha.includes("MODELO") ||
          linha.includes("VERS"))
      ) {
        const prox = linhas[i + 1];
        if (prox && prox.length > 3) {
          modelo = normalizeSpaces(prox.replace(/[^\w\s/.\-]/g, ""));
        }
      }

      // Cor (pode vir como COR PREDOMINANTE)
      if (!cor && linha.includes("COR")) {
        const prox = linhas[i + 1];
        if (prox && /^[A-ZÀ-Ü\s]{3,}$/.test(prox) && !prox.includes("*")) {
          cor = normalizeSpaces(prox);
        }
      }

      // Combustível
      if (!combustivel && linha.includes("COMBUST")) {
        const prox = linhas[i + 1];
        if (prox) combustivel = normalizeSpaces(prox);
      }

      // Chassi
      if (!chassi && linha.includes("CHASS")) {
        const prox = linhas[i + 1]?.replace(/\s+/g, "");
        const m = prox?.match(/[A-Z0-9]{17}/);
        if (m) chassi = m[0];
      }

      // Ano modelo
      if (
        !anoModelo &&
        (linha.includes("ANO MODELO") || linha.includes("ANO NICLELO"))
      ) {
        const prox = linhas[i + 1];
        if (prox) anoModelo = normalizeSpaces(prox);
      }

      // Ano fabricação
      if (
        !anoFabricacao &&
        (linha.includes("ANO FABRICA") || linha.includes("FABRICAÇÃO"))
      ) {
        const prox = linhas[i + 1];
        if (prox) anoFabricacao = normalizeSpaces(prox);
      }

      // Nome do proprietário (se aparecer bloco de veículo com NOME)
      if (!nomeProprietario && linha.includes("NOME") && i > 10) {
        const prox = linhas[i + 1];
        if (prox && looksLikeName(prox))
          nomeProprietario = normalizeSpaces(prox);
      }

      // CPF do proprietário
      if (
        !cpfProprietario &&
        (linha.includes("CPF") || linha.includes("CNPJ"))
      ) {
        const raw = linhas[i + 1]?.replace(/\D/g, "");
        if (raw?.length === 11) {
          cpfProprietario = `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(
            6,
            9
          )}-${raw.slice(9)}`;
        }
      }

      // Data de emissão do CRLV (heurística)
      if (
        !emissaoVeiculo &&
        (linha.includes("BRASILIA") ||
          linha.includes("LOCAL") ||
          linha.includes("DATA"))
      ) {
        const prox = linhas[i + 1];
        const m = prox?.match(/\b\d{2}\/\d{2}\/\d{4}\b/);
        if (m) emissaoVeiculo = m[0];
      }
    }

    // Passo 2: Fallback com regex (completa sem sobrescrever bons valores)
    const findValue = (patterns) => {
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match.length > 1 && match[1]) {
          return normalizeSpaces(match[1]);
        }
      }
      return "";
    };

    const patterns = {
      abordado: [
        /(?:NOME(?:\s+E\s+SOBRENOME)?)[^\n]*\n(?:.*\n)?([A-ZÀ-Ü]{2,}(?:\s+[A-ZÀ-Ü]{2,}){1,})/i,
        /2\s*e\s*1\s*NOME\s*E\s*SOBRENOME\s*\n(?:.*\n)?([A-ZÀ-Ü]{2,}(?:\s+[A-ZÀ-Ü]{2,})+)/i,
      ],
      naturalidade: [
        /(?:NATURALIDADE|LOCAL\s+DE\s+NASCIMENTO)[^\n]*[\n:]*\s*([A-ZÀ-Ú\s\/-]+)/i,
      ],
      dn: [/(?:DATA\s+NASC(?:IMENTO)?)[\s:.-]*([0-9]{2}\/[0-9]{2}\/[0-9]{4})/i],
      cpf: [
        /CPF\s*[:\n-]*\s*(\d{3}[.\s]?\d{3}[.\s]?\d{3}[-\s]?\d{2})/i,
        /\b(\d{3}[.\s]?\d{3}[.\s]?\d{3}[-\s]?\d{2})\b/,
      ],
      veiculoPlaca: [
        /PLACA\s*[:\n-]*\s*([A-Z]{3}[- ]?\d{4})/i,
        /\b([A-Z]{3}\d[A-Z]\d{2})\b/i,
      ],
      veiculoCor: [/COR(?:\s+PREDOMINANTE)?\s+([A-ZÁ-Ú\s]{3,})/i],
      veiculoModelo: [
        /MARCA\s*\/\s*MODELO\s*\/\s*VERS[AÃ]O\s+([^\n]+)/i,
        /MARCA.*MODELO.*VERS.*\n([^\n]+)/i,
      ],
      maeBloco: [
        /(?:[C-\s]*FILIA[CÇ]ÃO|GENITORA|MOTHER|MAE|MÃE)[\s:.-]*([\s\S]{10,200})/i,
      ],
    };

    // Completa nome se vazio
    if (!nome) {
      const nomeRx = findValue(patterns.abordado);
      if (nomeRx && nomeRx.split(" ").length >= 2) nome = UPPER(nomeRx);
    }

    // Completa naturalidade se vazio
    if (!naturalidade) {
      naturalidade = UPPER(findValue(patterns.naturalidade));
    }

    // Completa DN se vazio
    if (!dn) {
      const dnRx = findValue(patterns.dn);
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dnRx)) dn = dnRx;
    }

    // Completa CPF se vazio
    if (!cpf) {
      let cpfRx = findValue(patterns.cpf).replace(/\D/g, "");
      if (cpfRx.length === 11) {
        cpf = `${cpfRx.slice(0, 3)}.${cpfRx.slice(3, 6)}.${cpfRx.slice(
          6,
          9
        )}-${cpfRx.slice(9)}`;
      }
    }

    // Completa mãe se vazio com bloco de FILIAÇÃO (usando regex melhorado)
    if (!mae) {
      const bloco = findValue(patterns.maeBloco);
      if (bloco) {
        const lines = toLines(UPPER(bloco));
        const valid = [];
        for (const l of lines) {
          if (!l) continue;
          if (stopWordsMae.some((w) => l.includes(w))) break;
          if (!/\d/.test(l) && isAllCaps(l) && l.length >= 3) {
            valid.push(normalizeSpaces(l));
          } else {
            break;
          }
        }
        if (valid.length >= 3) {
          mae = normalizeSpaces(valid.slice(2).join(" "));
        } else if (valid.length >= 2) {
          mae = normalizeSpaces(valid[1]);
        }
      }
    }

    // Se ainda não encontrou o nome da mãe, tenta uma busca mais ampla no texto
    if (!mae) {
      // Busca por padrões específicos como "MARCIA HELENA" seguido por outros nomes
      const maeRegex =
        /(?:FILIAÇÃO|GENITORA|MAE|MÃE)[\s\S]*?([A-ZÀ-Ü]{2,}[\s\S]{5,80}?)(?:(?:\n|$)|(?:\d|\b(?:CPF|RG|NACIONA|ESTADO|ASSIN|LOCAL|DATA|CAT|N°)))/i;
      const match = text.match(maeRegex);

      if (match && match[1]) {
        const potencialMae = match[1].trim();
        // Verifica se o texto parece um nome
        if (
          potencialMae.split(/\s+/).length >= 2 &&
          !/^\d+$/.test(potencialMae)
        ) {
          mae = normalizeSpaces(UPPER(potencialMae));
        }
      }
    }

    // Completa veículo
    if (!placa)
      placa = UPPER(findValue(patterns.veiculoPlaca)).replace(" ", "");
    if (!cor) cor = UPPER(findValue(patterns.veiculoCor));
    if (!modelo)
      modelo = UPPER(findValue(patterns.veiculoModelo)).replace(
        /[^\w\s/.\-]/g,
        ""
      );

    // Preenche os campos no DOM
    elements.abordado.value = nome || "";
    elements.naturalidade.value = naturalidade || "";
    elements.genitora.value = mae || "";
    elements.cpf.value = cpf || "";
    elements.dn.value = dn || "";
    elements.veiculoPlaca.value = placa || "";

    if (elements.emissao) elements.emissao.value = emissao || "";
    if (elements.validade) elements.validade.value = validade || "";
    if (elements.categoria) elements.categoria.value = categoria || "";

    // Campos adicionais de veículo
    if (elements.veiculoModelo) elements.veiculoModelo.value = modelo || "";
    if (elements.veiculoCor) elements.veiculoCor.value = cor || "";
    if (elements.veiculoCombustivel)
      elements.veiculoCombustivel.value = combustivel || "";
    if (elements.veiculoChassi) elements.veiculoChassi.value = chassi || "";
    if (elements.veiculoAnoModelo)
      elements.veiculoAnoModelo.value = anoModelo || "";
    if (elements.veiculoAnoFabricacao)
      elements.veiculoAnoFabricacao.value = anoFabricacao || "";
    if (elements.veiculoProprietario)
      elements.veiculoProprietario.value = nomeProprietario || "";
    if (elements.veiculoCpfProprietario)
      elements.veiculoCpfProprietario.value = cpfProprietario || "";
    if (elements.veiculoEmissao)
      elements.veiculoEmissao.value = emissaoVeiculo || "";

    // Ativa campos de veículo se placa ou modelo forem encontrados
    if (placa || modelo) {
      const vc = document.getElementById("veiculoCheck");
      const na = document.getElementById("naoAplicaVeiculo");
      const vf = document.getElementById("veiculoFields");
      if (vc) vc.checked = true;
      if (na) na.checked = false;
      if (vf) vf.style.display = "block";
    }

    validateFormAndToggleActions();
  }
  function generateReportText() {
    const getVal = (elId) => elements[elId].value.trim() || "Não informado";
    const apelidoFinal = elements.naoAplicaApelido.checked
      ? "Não se aplica"
      : getVal("apelido");
    let report =
      `🚨 *ABORDAGEM POLICIAL* 🚨\n\n` +
      `*Abordado:* ${getVal("abordado")}\n` +
      `*Naturalidade:* ${getVal("naturalidade")}\n` +
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
      ? `- Tornozeleira: Sim. *Número:* ${getVal("tornozeleiraNumero")}\n`
      : `- Tornozeleira: Não se aplica.\n`;
    report += elements.veiculoCheck.checked
      ? `- Veículo: Sim.\n  *Placa:* ${getVal(
          "veiculoPlaca"
        )}\n  *Cor:* ${getVal("veiculoCor")}\n  *Modelo:* ${getVal(
          "veiculoModelo"
        )}\n`
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
      case "naturalidade":
        hintHtml = `<ul class="mb-0 mt-2 small">
          <li>Para extrair a naturalidade, use <code>Início: "NATURALIDADE"</code> ou <code>Início: "NATURAL DE"</code>.</li>
          <li>Se estiver em um documento de identidade, pode aparecer após "LOCAL DE NASC".</li>
          <li>Use <code>Fim: "DATA"</code> ou <code>Fim: "NASCIMENTO"</code> para limitar a extração.</li>
        </ul>`;
        break;
      case "genitora":
        hintHtml = `<ul class="mb-0 mt-2 small">
          <li>Para extrair o nome da mãe, tente localizar <code>Início: "FILIAÇÃO"</code> ou <code>Início: "MARCIA"</code> (por exemplo).</li>
          <li>Geralmente o nome da mãe aparece após o nome do pai.</li>
          <li>Em alguns documentos pode aparecer como "MARCIA HELENA LUIZ DE LIMA PEREIRA".</li>
        </ul>`;
        break;
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
