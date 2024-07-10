// Function to handle mouseover event and show tooltip
function handleMouseover(event) {
  if (event.target.classList.contains('highlighted')) {
    const category = event.target.getAttribute('data-category');
    showTooltip(event.target, category);
  }
}

// Function to handle mouseout event and hide tooltip
function handleMouseout() {
  hideTooltip();
}

// Function to show tooltip with dark pattern type
function showTooltip(element, category) {
  const tooltip = document.createElement('div');
  tooltip.classList.add('tooltip');
  tooltip.textContent = category;
  document.body.appendChild(tooltip);

  // Position tooltip relative to the element
  const rect = element.getBoundingClientRect();
  tooltip.style.left = `${rect.left + window.scrollX + rect.width / 2}px`;
  tooltip.style.top = `${rect.top + window.scrollY - rect.height / 2}px`;
}

// Function to hide tooltip
function hideTooltip() {
  const tooltip = document.querySelector('.tooltip');
  if (tooltip) {
    tooltip.remove();
  }
}

// Listen for mouseover events on elements with 'highlighted' class
document.addEventListener('mouseover', handleMouseover);

// Listen for mouseout events to remove tooltip
document.addEventListener('mouseout', handleMouseout);
