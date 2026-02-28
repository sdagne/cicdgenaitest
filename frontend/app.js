// Hardcoded to point EXACTLY to your running EC2 backend:
const API_BASE_URL = 'http://ec2-13-53-200-223.eu-north-1.compute.amazonaws.com:8000';

// DOM Elements
const inventoryBody = document.getElementById('inventory-body');
const addItemForm = document.getElementById('add-item-form');
const itemNameInput = document.getElementById('item-name');
const itemPriceInput = document.getElementById('item-price');
const loadingIndicator = document.getElementById('loading');
const refreshBtn = document.getElementById('refresh-btn');
const errorMessage = document.getElementById('error-message');

// Fetch and display all items from the EC2 backend
async function fetchItems() {
    showLoading(true);
    hideError();

    try {
        const response = await fetch(`${API_BASE_URL}/items/`);

        if (!response.ok) {
            throw new Error(`API returned status: ${response.status}`);
        }

        const items = await response.json();
        renderTable(items);
    } catch (error) {
        console.error('Error fetching items:', error);

        // This is a common error when testing locally against a remote server
        if (error.message === 'Failed to fetch') {
            showError('CRITICAL: Cannot reach the API. Either your EC2 server is down, OR you have a CORS (Cross-Origin Resource Sharing) error in your FastAPI code. Your API must allow requests from local browsers.');
        } else {
            showError(`Failed to fetch data from EC2: ${error.message}`);
        }

        renderTable([]);
    } finally {
        showLoading(false);
    }
}

// Add a new item via POST request
async function addItem(event) {
    event.preventDefault(); // Prevent page from reloading

    const name = itemNameInput.value.trim();
    const price = parseFloat(itemPriceInput.value);

    if (!name || isNaN(price)) {
        showError('Please enter valid name and price.');
        return;
    }

    const submitBtn = addItemForm.querySelector('button');
    submitBtn.textContent = 'Creating...';
    submitBtn.disabled = true;
    hideError();

    try {
        const response = await fetch(`${API_BASE_URL}/items/`, {
            method: 'POST',
            headers: {
                // We MUST tell the server we are sending JSON data
                'Content-Type': 'application/json',
            },
            // Convert our Javascript data into a JSON string
            body: JSON.stringify({ name, price }),
        });

        if (!response.ok) {
            throw new Error(`API returned status: ${response.status}`);
        }

        // Clear the form visually
        itemNameInput.value = '';
        itemPriceInput.value = '';

        // Re-fetch the data from EC2 to show the newly added item!
        await fetchItems();
    } catch (error) {
        console.error('Error adding item:', error);
        showError('Failed to create item. See console for details.');
    } finally {
        submitBtn.textContent = 'Create Item';
        submitBtn.disabled = false;
    }
}

// Delete an item via DELETE request
async function deleteItem(id) {
    if (!confirm('Are you sure you want to delete this item?')) return;

    hideError();
    try {
        const response = await fetch(`${API_BASE_URL}/items/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`API returned status: ${response.status}`);
        }

        // Refresh the table to verify deletion
        await fetchItems();
    } catch (error) {
        console.error('Error deleting item:', error);
        showError('Failed to delete item.');
    }
}

// Draw the items in the HTML table
function renderTable(items) {
    inventoryBody.innerHTML = ''; // Clear existing rows

    // Check if the API returned an empty list
    if (!items || items.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="4" style="text-align: center; color: var(--text-muted); padding: 3rem;">No items found in the database. Add one above!</td>`;
        inventoryBody.appendChild(tr);
        return;
    }

    items.forEach(item => {
        // We use fallback values in case the API structure doesn't perfectly match
        const id = item.id !== undefined ? item.id : Math.random().toString(36).substr(2, 9);
        const name = item.name || 'Unknown';
        const price = item.price !== undefined ? item.price : 0;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${id}</td>
            <td style="font-weight: 600;">${name}</td>
            <td style="color: var(--accent);">$${price.toFixed(2)}</td>
            <td>
                <button class="btn-danger" onclick="deleteItem('${id}')">Delete</button>
            </td>
        `;

        inventoryBody.appendChild(tr);
    });
}

// UI Helpers (Show/Hide Loading Spinners and Errors)
function showLoading(show) {
    loadingIndicator.style.display = show ? 'block' : 'none';
    if (show) inventoryBody.innerHTML = '';
}

function showError(msg) {
    errorMessage.textContent = msg;
    errorMessage.classList.remove('hidden');
}

function hideError() {
    errorMessage.classList.add('hidden');
}

// Connect the HTML buttons to the Javascript functions
addItemForm.addEventListener('submit', addItem);
refreshBtn.addEventListener('click', fetchItems);

// As soon as the page opens, fetch the current inventory from AWS!
document.addEventListener('DOMContentLoaded', fetchItems);
