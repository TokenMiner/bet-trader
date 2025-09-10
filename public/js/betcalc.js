// betcalc.js
document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Elements ---
  const modeEls = document.getElementsByName("mode");
  const msgResult = document.getElementById("msgResult");
  // Back bet
  const backSection = document.getElementById("backSection");
  const backOdds = document.getElementById("backOdds");
  const backStake = document.getElementById("backStake");
  const backResult = document.getElementById("backResult");

  // Lay bet
  const laySection = document.getElementById("laySection");
  const layOdds = document.getElementById("layOdds");
  const layPayout = document.getElementById("layPayout");
  const layLiability = document.getElementById("layLiability");
  const layResult = document.getElementById("layResult");

  // Cashout / Freebet
  const cashoutSection = document.getElementById("cashoutSection");
  const useFreebet = document.getElementById("useFreebet");
  const freebetValue = document.getElementById("freebetValue");
  const cashoutResult = document.getElementById("cashoutResult");

  // Reset + Dutching
  const resetButton = document.getElementById("resetCalculatorBtn");
  const dutchingBtn = document.getElementById("calculateDutchingBtn");
  const dutchingResult = document.getElementById("dutchingResult");
  	if (dutchingBtn) {
	  dutchingBtn.addEventListener('click', calculateDutching);
	}


  // Helper: read selected mode
  function getMode() {
    for (const el of modeEls) if (el.checked) return el.value;
    return "back-first";
  }
  // Listen for mode changes
	document.querySelectorAll('input[name="mode"]').forEach(radio => {
	  radio.addEventListener('change', () => {
		updateTitles();
	  });
	});

	// Function to update titles
	function updateTitles() {
	  const mode = document.querySelector('input[name="mode"]:checked')?.value;

	  const backSection = document.getElementById("backSection");
	  const laySection = document.getElementById("laySection");
	  const grid = backSection.parentNode; // container with .grid

	  function animateSwap(el) {
		el.classList.add("swap-enter");
		requestAnimationFrame(() => {
		  el.classList.add("swap-enter-active");
		  el.addEventListener("transitionend", () => {
			el.classList.remove("swap-enter", "swap-enter-active");
		  }, { once: true });
		});
	  }

	  if (mode === "back-first") {
		document.getElementById("backTitle").textContent = "Back Bet";
		document.getElementById("layTitle").textContent = "Hedge with Lay Bet (risk-based)";

		if (grid.firstChild !== backSection) {
		  grid.insertBefore(backSection, laySection);
		  animateSwap(backSection);
		}
		if (document.getElementById("backOdds")) document.getElementById("backOdds").focus();

	  } else if (mode === "lay-first") {
		document.getElementById("backTitle").textContent = "Hedge with Back Bet";
		document.getElementById("layTitle").textContent = "Lay Bet (risk-based)";

		if (grid.firstChild !== laySection) {
		  grid.insertBefore(laySection, backSection);
		  animateSwap(laySection);
		}
		if (document.getElementById("layOdds")) document.getElementById("layOdds").focus();
	  }
	}

	// Call once on page load to set initial titles
  updateTitles();
  
  console.log("Mode switcher initialized — Back/Lay sections will toggle on radio change.");
  
  document.getElementById("calcBackBtn").addEventListener("click", () => {
  const mode = document.querySelector("input[name='mode']:checked").value;
  if (mode === "back-first") backFirst();
  if (mode === "lay-first") layFirst();
  });

document.getElementById("calcLayBtn").addEventListener("click", () => {
  const mode = document.querySelector("input[name='mode']:checked").value;
  if (mode === "back-first") backFirst();
  if (mode === "lay-first") layFirst();
});

document.getElementById("recalcAllBtn").addEventListener("click", () => {
  const mode = document.querySelector('input[name="mode"]:checked')?.value;
  if (mode === "back-first") {
    backFirst();
  } else {
    layFirst();
  }
});

if (useFreebet) {
  useFreebet.addEventListener("change", () => {
    const mode = document.querySelector('input[name="mode"]:checked')?.value;
    if (mode === "back-first") {
      backFirst();
    } else {
      layFirst();
    }
  });
}

// Wire reset button
  if (resetButton) {
    resetButton.addEventListener('click', resetAll);
  }

// Reset function -----------------------------
function resetAll() {
  // Clear Back Bet inputs
  backOdds.value = '';
  backStake.value = '';
  backResult.innerHTML = '';
  modeEls.value = 'back-first';
  // Clear Lay Bet inputs
  layOdds.value = '';
  layPayout.value = '';
  layLiability.value = '';
  layResult.innerHTML = '';

  // Clear Cashout / Freebet
  useFreebet.checked = false;
  msgResult.innerHTML = '';
  updateTitles();
  // Put caret on the first Back input
  if (backOdds) backOdds.focus();
}
	
// =======================
// Helper functions
// =======================
function safeNum(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : NaN;
}

// Format helper for numeric check (returns true if valid number)
function isValid(n) { return !isNaN(n) && Number.isFinite(n); }

// Calculate Lay Stake from Liability
function layStakeFromLiability(odds, liability) {
    return liability / (odds - 1);
}

// === MAIN PATHS ===
function backFirst() {
  const backOddsVal  = parseFloat(backOdds.value);
  const backStakeVal = parseFloat(backStake.value);
  const layOddsVal   = parseFloat(layOdds.value);
  const layPayoutVal = parseFloat(layPayout.value);
  const layLiabilityVal = parseFloat(layLiability.value);
  const useFreebetVal   = useFreebet.checked;

  // --- Step 1: unattended Back bet ---
  if (backOddsVal > 1 && backStakeVal > 0) {
    backResult.innerHTML = `
      If Bet is left unattended:<br>
      Win ${fmt(backStakeVal * (backOddsVal - 1))}, 
      Loss ${fmt(backStakeVal)}
    `;
  }

  // --- Step 2: Hedge with Lay ---
  if (backOddsVal > 1 && backStakeVal > 0 && layOddsVal > 1) {
    const suggestedLayStake = (backStakeVal * backOddsVal) / layOddsVal;
    const liability = (layOddsVal - 1) * suggestedLayStake;
    const profit = suggestedLayStake - backStakeVal;

    layPayout.value = suggestedLayStake.toFixed(2);
    layLiability.value = liability.toFixed(2);

    layResult.innerHTML = `
      Hedge (Lay): Suggested Lay Stake = ${fmt(suggestedLayStake)} @ ${layOddsVal}<br>
      Any outcome generates → ${fmt(profit)}
    `;
  }

  // --- Step 3: Freebet from Back bet ---
  if (useFreebetVal) {
	if (!isValid(backOddsVal) || !isValid(backStakeVal) || !isValid(layOddsVal)) {
    msgResult.innerHTML = `⚠️ Invalid inputs, maybe you forgot to enter the correct odds or stake.`;
    return;
  }
    const freeProfit = backStakeVal * (backOddsVal - layOddsVal);

    msgResult.innerHTML = `
      Freebet mode active:<br>
      Stake = ${fmt(backStakeVal)} @ ${backOddsVal}<br>
      If Back Bet wins → ${fmt(freeProfit)}, If Back Bet loses → R$ 0.00
    `;
  }
}

function layFirst() {
  const layOddsVal   = parseFloat(layOdds.value);
  const layLiabilityVal = parseFloat(layLiability.value);
  const backOddsVal  = parseFloat(backOdds.value);
  const useFreebetVal   = useFreebet.checked;

  // --- Step 1: unattended Lay bet ---
  if (layOddsVal > 1 && layLiabilityVal > 0) {
    const payout = layStakeFromLiability(layOddsVal, layLiabilityVal);
    layPayout.value = payout.toFixed(2);

    layResult.innerHTML = `
      If Bet is left unattended:<br>
      Win ${fmt(payout)}, Loss ${fmt(layLiabilityVal)}
    `;
  }

  // --- Step 2: Hedge with Back ---
  if (layOddsVal > 1 && layLiabilityVal > 0 && backOddsVal > 1) {
    const layStake = layStakeFromLiability(layOddsVal, layLiabilityVal);
    const suggestedBackStake = (layStake * layOddsVal) / backOddsVal;
    const profit = layStake - suggestedBackStake;

    backStake.value = suggestedBackStake.toFixed(2);

    backResult.innerHTML = `
      Hedge (Back): Required Back Stake = ${fmt(suggestedBackStake)} @ ${backOddsVal}<br>
      Any outcome wins → ${fmt(profit)}
    `;
  }

  // --- Step 3: Freebet from Lay bet ---
  if (useFreebetVal) {
	if (!isValid(layOddsVal) || !isValid(layLiabilityVal) || !isValid(backOddsVal)){
		 msgResult.innerHTML = `Invalid inputs, maybe you forgot to enter the correct odds or liability`;
		return;
	}
    const freeStake = layLiabilityVal / (backOddsVal - 1);
    const lockedProfit = (layLiabilityVal / (layOddsVal - 1)) - freeStake;

    backStake.value = freeStake.toFixed(2);

    msgResult.innerHTML = `
      Freebet mode active:<br>
      Stake = ${fmt(freeStake)} @ ${backOddsVal}<br>
      If Lay Bet wins → ${fmt(lockedProfit)}, If Lay Bet loses → R$ 0.00
    `;
  }
}
//------------------------------------ END DOM----------------------------------------------
});
// ===============================================================================




// ================================================================================

function calculateDutching(event) {
  event.preventDefault();
  const totalStake = parseFloat(document.getElementById('dutchingStake').value);
  const oddsInputs = [
    parseFloat(document.getElementById('odds1').value),
    parseFloat(document.getElementById('odds2').value),
    parseFloat(document.getElementById('odds3').value),
    parseFloat(document.getElementById('odds4').value)
  ];

  const validOdds = oddsInputs.filter(odds => !isNaN(odds) && odds > 1);
  if (validOdds.length === 0 || isNaN(totalStake) || totalStake <= 0) {
    alert('Please enter valid odds (>1) and a positive total stake.');
    return;
  }

  const totalInverse = validOdds.reduce((sum, odds) => sum + 1 / odds, 0);
  const stakes = validOdds.map(odds => (totalStake / odds) / totalInverse);
  const returns = validOdds.map((odds, i) => stakes[i] * odds);
  const profit = returns[0] - totalStake;

  let output = `<h4>Dutching Breakdown</h4>`;
  validOdds.forEach((odds, i) => {
    output += `<p>🎯 Odds ${odds.toFixed(
      2
    )} → Stake: ${fmt(stakes[i])} → Return: ${fmt(returns[i])}</p>`;
  });
  output += `<p>✅ Guaranteed Return: ${fmt(returns[0])}</p>`;
  output += `<p>💰 Profit: ${fmt(profit)}</p>`;

  document.getElementById('dutchingResult').innerHTML = output;
}

  // Utility functions
  function fmt(v) {
    if (isNaN(v)) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v).toFixed(2));
  }