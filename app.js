// Load products and set up event listeners
let products = [];

// Formula: Product Rate = Copper Rate × (Net Rate ÷ 105 × 100 × Ratio) ÷ 913 ÷ Ratio × 100
function calculateProductRate(copperRate, netRate, ratio) {
  if (!copperRate || !netRate || !ratio) return '';
  // Using the formula as provided
  const intermittentResult = copperRate * ((((((netRate*100)/105) * (ratio/100)) / 913) / ratio )* 100);
  const result = (intermittentResult * 1.05)
  return result.toFixed(2);
}

function renderTable(copperRate) {
  const tbody = document.querySelector('#products_table tbody');
  tbody.innerHTML = '';
  products.forEach((product, idx) => {
    const price = calculateProductRate(copperRate, product.net_rate, product.ratio);
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${idx + 1}</td>
      <td class="left-align">${product.description}</td>
      <td>${product.packing}</td>
      <td>${price ? '₹' + price : '-'}</td>
    `;
    tbody.appendChild(row);
  });
}

function getQueryParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// Fetch products.json and initialize
document.addEventListener('DOMContentLoaded', function() {
  fetch('products.json')
    .then(response => response.json())
    .then(data => {
      products = data;
      const copperInput = document.getElementById('copper_rate');
      // Set copper rate from query param if present
      const rateParam = getQueryParam('rate');
      if (rateParam) {
        copperInput.value = rateParam;
        // Materialize label fix
        if (M && M.updateTextFields) M.updateTextFields();
      }
      renderTable(copperInput.value);
      copperInput.addEventListener('input', function() {
        renderTable(this.value);
      });
    });
});
