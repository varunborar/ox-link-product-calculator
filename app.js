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

/**
 * Calculate the final product rate using raw material usage, wastage, additional costing, and margin.
 * @param {object} product - The product object from products.json
 * @param {object} rawMaterialRates - Array of raw material rates from RawMaterialRates.json
 * @param {object} [variables] - Optional object mapping raw material ids to override rates
 * @returns {number} - The final calculated product rate
 */
function calculateProductRateV2(product, rawMaterialRates, variables = {}) {
  if (!product.rawMaterials) return null;
  let materialCost = 0;
  // 1. Calculate cost for each raw material (usage * rate)
  for (const [matId, matInfo] of Object.entries(product.rawMaterials)) {
    let rate = variables.hasOwnProperty(matId)
      ? parseFloat(variables[matId])
      : (rawMaterialRates.find(r => r.id === matId)?.rate ?? 0);
    let usage = parseFloat(matInfo.usage);
    let wastagePercent = product.wastage && product.wastage[matId] ? parseFloat(product.wastage[matId]) : 0;
    let costWithWastage = usage * rate * (1 + wastagePercent / 100);
    // if (usage > 0) {
    //   console.log(`productName: ${product.description} matId: ${matId} cost: ${rate*usage} wastagePercent: ${wastagePercent} wastageCos: ${costWithWastage-(usage*rate)}`);
    // }
    materialCost += costWithWastage;
  }
  // 2. Add additional costing (sum all values in additonalCosting)
  let additionalCost = 0;
  if (product.additonalCosting) {
    for (const val of Object.values(product.additonalCosting)) {
      additionalCost += parseFloat(val);
    }
  }
  // 3. Calculate manufacturing cost based on per-material manufacturing cost
  let manufacturingCost = 0;
  if (product.manufacturingCost) {
    for (const [matId, matInfo] of Object.entries(product.rawMaterials)) {
      if (product.manufacturingCost.hasOwnProperty(matId)) {
        let usage = parseFloat(matInfo.usage);
        let perUnitCost = parseFloat(product.manufacturingCost[matId]);
        manufacturingCost += usage * perUnitCost;
      }
    }
  }
  // 4. Calculate total cost
  let manufacturingMultiplier = product.manufacturingMultiplier ? parseFloat(product.manufacturingMultiplier) : 1;
  let totalCost = materialCost + additionalCost + (manufacturingCost * manufacturingMultiplier);
  let multiplier = product.packingSize && product.packingSize.multiplier ? parseFloat(product.packingSize.multiplier) : 1;
  let packageCost = totalCost * multiplier;
  let marginPercent = product.margin ? parseFloat(product.margin) : 0;
  let finalCost = packageCost / (1 - (marginPercent / 100));
  // console.log(`productName: ${product.description} materialCost: ${materialCost} additionalCost: ${additionalCost} manufacturingMultiplier: ${manufacturingMultiplier} manufacturingCost: ${manufacturingCost*manufacturingMultiplier} totalCost: ${totalCost} packageCost: ${packageCost} marginPercent: ${marginPercent} finalCost: ${finalCost}`);
  return Math.round(finalCost);
}

let rawMaterialRatesCache = null;

async function renderProducts(copperRate) {
  // Fetch and cache raw material rates
  if (!rawMaterialRatesCache) {
    rawMaterialRatesCache = await fetch('RawMaterialRates.json').then(res => res.json());
  }
  
  // Render table view (desktop/tablet)
  const tbody = document.querySelector('#products_table tbody');
  tbody.innerHTML = '';
  
  // Render card view (mobile)
  const cardsContainer = document.querySelector('#products_cards');
  cardsContainer.innerHTML = '';
  
  // Prepare variables object with copper override
  const variables = { copper: copperRate };
  
  products.forEach((product, idx) => {
    let price = '';
    if (product.rawMaterials) {
      price = calculateProductRateV2(product, rawMaterialRatesCache, variables);
    } else if (product.net_rate && product.ratio) {
      // fallback for legacy products
      price = calculateProductRate(copperRate, product.net_rate, product.ratio);
    }
    
    // Create table row
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${idx + 1}</td>
      <td class="left-align">${product.description}</td>
      <td>${product.packing}</td>
      <td>${price ? '₹' + Number(price).toFixed(2) : '-'}</td>
    `;
    tbody.appendChild(row);
    
    // Create card
    const card = document.createElement('div');
    card.className = 'col s12 m6 l4';
    card.innerHTML = `
      <div class="product-card">
        <div class="card-header">
          <h6>${idx + 1}. ${product.description}</h6>
        </div>
        <div class="card-content">
          <div class="product-info">
            <span class="label">Packing</span>
            <span class="value">${product.packing}</span>
          </div>
          <div class="product-info">
            <span class="label">Price</span>
            <span class="value price">${price ? '₹' + Number(price).toFixed(2) : '-'}</span>
          </div>
        </div>
      </div>
    `;
    cardsContainer.appendChild(card);
  });
}

function getQueryParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

function setQueryParam(name, value) {
  const url = new URL(window.location);
  url.searchParams.set(name, value);
  window.history.replaceState({}, '', url);
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
        if (window.M && M.updateTextFields) M.updateTextFields();
      }
      renderProducts(copperInput.value);

      // Prevent form submission and update query param on Enter
      if (copperInput.form) {
        copperInput.form.addEventListener('submit', function(e) {
          e.preventDefault();
        });
      }
      copperInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          setQueryParam('rate', this.value);
          renderProducts(this.value);
        }
      });
      copperInput.addEventListener('input', function() {
        renderProducts(this.value);
      });
    });
});
