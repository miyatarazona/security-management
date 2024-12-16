let questions = [];
let currentQuestionIndex = 0;
let userAnswers = [];
const appContainer = document.getElementById("app");

// 配列をシャッフルする関数
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// CSVファイルの読み込み
fetch('qa.csv')
  .then(response => response.text())  // テキストとして読み込む
  .then(csvData => {
    // CSVをパースして問題データを生成
    Papa.parse(csvData, {
      complete: function(results) {
        // CSVからデータを生成
        let allQuestions = results.data.map(row => ({
          question: row[0],
          options: row.slice(1, 5),  // 選択肢は2番目から5番目
          correctAnswer: row[5]  // 正解は6番目（テキスト）
        }));

        // 問題をシャッフルして10件選択
        questions = shuffleArray(allQuestions).slice(0, 10);

        // 選択肢をランダム化
        questions.forEach(q => {
          q.options = shuffleArray(q.options);
        });

        initQuiz();
      },
      header: false
    });
  })
  .catch(error => {
    console.error("CSVファイルの読み込みエラー:", error);
    appContainer.innerHTML = "<p>CSVファイルの読み込みに失敗しました。</p>";
  });

// 初期化：スタート画面を表示
function initQuiz() {
  appContainer.innerHTML = `
    <div class="card shadow-sm p-4 text-center" style="width: 1000px;">
      <h1 class="card-title mb-4">情報セキュリティマネジメント試験 英語略語テスト</h1>
      <button class="btn btn-primary btn-lg" id="start-btn" style="width: 60%; display: block; margin: 0 auto;">テストを開始</button>
    </div>
  `;

  document.getElementById("start-btn").addEventListener("click", () => {
    displayQuestion(currentQuestionIndex);
  });
}

// 質問表示
function displayQuestion(index) {
  const question = questions[index];
  appContainer.innerHTML = `
    <div class="card shadow-sm p-4" style="width: 1000px;">
      <h1 class="card-title text-center mb-4">情報セキュリティマネジメント試験 英語略語テスト</h1>
      <div id="question-text" class="question-text h5 mb-4">
        ${index + 1}. ${question.question} <!-- 問題番号を追加 -->
      </div>
      <form id="answer-form" class="mb-4">
        ${question.options.map((option, idx) => `
          <label class="form-check-label d-block">
            <input type="radio" name="answer" value="${option}" class="form-check-input"> ${option}
          </label>
        `).join("")}
      </form>
      <div class="d-flex justify-content-center mb-4">
        <button id="submit-btn" class="btn btn-primary" style="width: 200px;" disabled>回答を送信</button>
      </div>
      <div id="feedback" class="feedback text-center"></div>
      <div class="d-flex justify-content-center mb-4" style="display: none;" id="next-btn-container">
        <button id="next-btn" class="btn btn-secondary" style="margin-top: 20px;" disabled>次の問題</button>
      </div>
    </div>
  `;

  const submitBtn = document.getElementById("submit-btn");
  const nextBtn = document.getElementById("next-btn");
  const answerForm = document.getElementById("answer-form");

  // 回答選択時に「回答を送信」ボタンを有効化
  answerForm.addEventListener("change", () => {
    submitBtn.disabled = false;
  });

  submitBtn.addEventListener("click", handleSubmit);
  nextBtn.addEventListener("click", handleNext);
}

// 回答送信処理
function handleSubmit() {
  const selectedOption = document.querySelector('input[name="answer"]:checked');
  if (!selectedOption) {
    document.getElementById("feedback").textContent = "選択肢を選んでください。";
    return;
  }

  userAnswers[currentQuestionIndex] = selectedOption.value;
  const feedback = userAnswers[currentQuestionIndex] === questions[currentQuestionIndex].correctAnswer
    ? `<div class="correct-answer animated bounceIn">正解です！</div>`
    : `<div class="incorrect-answer">不正解です。</div>`;

  document.getElementById("feedback").innerHTML = feedback;

  // 次のボタンを表示し、有効化
  document.getElementById("next-btn").disabled = false;
  document.getElementById("submit-btn").style.display = "none";
  document.getElementById("next-btn-container").style.display = "block";
}

// 次の質問へ
function handleNext() {
  currentQuestionIndex++;
  if (currentQuestionIndex < questions.length) {
    displayQuestion(currentQuestionIndex);
  } else {
    displayResults();
  }
}

// 結果表示
function displayResults() {
  const correctAnswers = userAnswers.filter((answer, index) => answer === questions[index].correctAnswer).length;
  const totalPoints = Math.round((100 / questions.length) * correctAnswers);

  appContainer.innerHTML = `
    <div class="card shadow-sm p-4" style="width: 1000px;">
      <h2 class="text-center mb-4">テスト結果</h2>
      <p class="text-center mb-4" style="font-size: 24px;"><strong>あなたの点数: ${totalPoints}点 / 100点</strong></p>
      <table class="table table-striped">
        <thead>
          <tr>
            <th>問題</th>
            <th>あなたの解答</th>
            <th>正しい答え</th>
            <th style="white-space: nowrap;">結果</th>
          </tr>
        </thead>
        <tbody>
          ${questions.map((q, index) => `
            <tr>
              <td>${q.question}</td>
              <td>${userAnswers[index] || "未解答"}</td>
              <td>${q.correctAnswer}</td>
              <td style="white-space: nowrap;" class="${userAnswers[index] === q.correctAnswer ? 'text-success' : 'text-danger'}">
                ${userAnswers[index] === q.correctAnswer ? "正解" : "不正解"}
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      <div class="text-center mt-4">
        <button class="btn btn-success" onclick="downloadExcel()">結果をExcelでダウンロード</button>
        <button class="btn btn-info" onclick="window.open('https://mango-vermicelli-0e5.notion.site/15cdf2466f71806fbf32fd7b2a328aa0', '_blank')">英語略語まとめはこちら</button>
      </div>
    </div>
  `;
}

// Excel出力
function downloadExcel() {
  const wb = XLSX.utils.book_new();
  const data = questions.map((q, index) => ({
    Question: q.question,
    YourAnswer: userAnswers[index] || "未解答",
    CorrectAnswer: q.correctAnswer,
    Result: userAnswers[index] === q.correctAnswer ? "正解" : "不正解"
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Results");
  XLSX.writeFile(wb, "test_results.xlsx");
}
