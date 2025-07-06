// Logo generation script for Tyumi nonagon logo
// Logo style is configured in config.js as window.LOGO_STYLE
// Set to 'original' for K9 graph logo, 'concentric' for 9 concentric nonagons

function generateNonagonLogo() {
  const svgContainer = document.querySelector('#tyumi-logo g');
  
  if (window.LOGO_STYLE === 'concentric') {
    generateConcentricNonagonsLogo(svgContainer);
  } else {
    generateOriginalLogo(svgContainer);
  }
}

function generateOriginalLogo(svgContainer) {
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

function generateConcentricNonagonsLogo(svgContainer) {
  const numSides = 9;
  const centerX = 50;
  const centerY = 50;
  const maxRadius = 45; // Maximum radius to fit within viewBox
  const minRadius = 5;  // Minimum radius for innermost nonagon
  
  // Create 9 concentric nonagons with decreasing radius
  for (let ring = 0; ring < 9; ring++) {
    // Calculate radius for this ring (linear decrease from outer to inner)
    const radius = maxRadius - (ring * (maxRadius - minRadius) / 8);
    
    // Calculate vertices for this nonagon
    const vertices = [];
    for (let i = 0; i < numSides; i++) {
      const angle = (i * 2 * Math.PI / numSides) - (Math.PI / 2) - (Math.PI / numSides); // Adjusted for 9 sides to have a flat top
      vertices.push({
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      });
    }
    
    // Create path for this nonagon
    let path = "M";
    vertices.forEach((v, i) => {
      path += `${v.x} ${v.y} `;
      if (i < numSides - 1) {
        path += "L";
      }
    });
    path += "Z";
    
    // Create and style the nonagon element
    const nonagon = document.createElementNS("http://www.w3.org/2000/svg", "path");
    nonagon.setAttribute("d", path);
    nonagon.setAttribute("fill", "none");
    
    // Vary stroke width and opacity for visual depth
    const strokeWidth = 1 + (ring * 0.1); // Slightly thicker strokes for outer rings
    const opacity = 0.3 + (0.7 * (8 - ring) / 8); // More opaque for outer rings
    
    nonagon.setAttribute("stroke-width", strokeWidth.toString());
    nonagon.setAttribute("stroke-opacity", opacity.toString());
    
    svgContainer.appendChild(nonagon);
  }
}

// Initialize logo when DOM is ready
document.addEventListener('DOMContentLoaded', generateNonagonLogo);
