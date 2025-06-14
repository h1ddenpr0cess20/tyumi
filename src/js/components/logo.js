// Logo generation script for Tyumi nonagon logo
function generateNonagonLogo() {
  const numSides = 9;
  const radius = 45; // Slightly smaller to fit stroke
  const centerX = 50;
  const centerY = 50;
  const vertices = [];
  
  for (let i = 0; i < numSides; i++) {
    const angle = (i * 2 * Math.PI / numSides) - (Math.PI / 2) - (Math.PI / numSides); // Adjusted for 9 sides to have a flat top
    vertices.push({
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    });
  }

  // Get the SVG container
  const svgContainer = document.querySelector('#tyumi-logo g');
  
  // Draw the outer nonagon
  let outerPath = "M";
  vertices.forEach((v, i) => {
    outerPath += `${v.x} ${v.y} `;
    if (i < numSides - 1) {
      outerPath += "L";
    }
  });
  outerPath += "Z";
  const outerNonagon = document.createElementNS("http://www.w3.org/2000/svg", "path");
  outerNonagon.setAttribute("d", outerPath);
  svgContainer.appendChild(outerNonagon);

  // Draw lines connecting all vertices (K9 graph)
  for (let i = 0; i < numSides; i++) {
    for (let j = i + 1; j < numSides; j++) {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", vertices[i].x);
      line.setAttribute("y1", vertices[i].y);
      line.setAttribute("x2", vertices[j].x);
      line.setAttribute("y2", vertices[j].y);
      svgContainer.appendChild(line);
    }
  }
}

// Initialize logo when DOM is ready
document.addEventListener('DOMContentLoaded', generateNonagonLogo);
