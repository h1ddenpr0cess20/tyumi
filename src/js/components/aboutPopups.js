// About Tab Popup Functions

async function loadContentIntoContainer(url, containerId) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    
    // Create a temporary DOM to extract just the main content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Extract content from the main sections (privacy-content or contact-content)
    const mainContent = tempDiv.querySelector('.privacy-content') || tempDiv.querySelector('.contact-content');
    if (mainContent) {
      document.getElementById(containerId).innerHTML = mainContent.innerHTML;
    } else {
      // Fallback: extract body content
      const bodyContent = tempDiv.querySelector('body');
      if (bodyContent) {
        document.getElementById(containerId).innerHTML = bodyContent.innerHTML;
      }
    }
  } catch (error) {
    console.error('Error loading content:', error);
    document.getElementById(containerId).innerHTML = '<p>Error loading content. Please try again.</p>';
  }
}

async function showPrivacyPopup() {
  const aboutContent = document.querySelector('#content-about .about-content');
  const privacyPopup = document.getElementById('privacy-popup');
  
  if (aboutContent && privacyPopup) {
    aboutContent.style.display = 'none';
    privacyPopup.style.display = 'flex';
    
    // Load privacy policy content
    await loadContentIntoContainer('src/html/privacy-policy.html', 'privacy-content-container');
    
    // Trigger reflow and add active class for animation
    privacyPopup.offsetHeight;
    privacyPopup.classList.add('active');
  }
}

function hidePrivacyPopup() {
  const aboutContent = document.querySelector('#content-about .about-content');
  const privacyPopup = document.getElementById('privacy-popup');
  
  if (aboutContent && privacyPopup) {
    privacyPopup.classList.remove('active');
    setTimeout(() => {
      privacyPopup.style.display = 'none';
      aboutContent.style.display = 'block';
    }, 250); // Match CSS transition duration
  }
}

async function showContactPopup() {
  const aboutContent = document.querySelector('#content-about .about-content');
  const contactPopup = document.getElementById('contact-popup');
  
  if (aboutContent && contactPopup) {
    aboutContent.style.display = 'none';
    contactPopup.style.display = 'flex';
    
    // Load contact content
    await loadContentIntoContainer('src/html/contact.html', 'contact-content-container');
    
    // Trigger reflow and add active class for animation
    contactPopup.offsetHeight;
    contactPopup.classList.add('active');
  }
}

function hideContactPopup() {
  const aboutContent = document.querySelector('#content-about .about-content');
  const contactPopup = document.getElementById('contact-popup');
  
  if (aboutContent && contactPopup) {
    contactPopup.classList.remove('active');
    setTimeout(() => {
      contactPopup.style.display = 'none';
      aboutContent.style.display = 'block';
    }, 250); // Match CSS transition duration
  }
}
