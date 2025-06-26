// About Tab Popup Functions

async function loadContentIntoContainer(url, containerId) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    
    // Create a temporary DOM to extract just the main content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;    // Extract content from the main sections (privacy-content, terms-content, help-content, contact-content, or download-content)
    const mainContent = tempDiv.querySelector('.privacy-content') || tempDiv.querySelector('.terms-content') || 
                       tempDiv.querySelector('.help-content') || tempDiv.querySelector('.contact-content') ||
                       tempDiv.querySelector('.download-content');
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

async function showTermsPopup() {
  const aboutContent = document.querySelector('#content-about .about-content');
  const termsPopup = document.getElementById('terms-popup');
  
  if (aboutContent && termsPopup) {
    aboutContent.style.display = 'none';
    termsPopup.style.display = 'flex';
    
    // Load terms of service content
    await loadContentIntoContainer('src/html/terms-of-service.html', 'terms-content-container');
    
    // Trigger reflow and add active class for animation
    termsPopup.offsetHeight;
    termsPopup.classList.add('active');
  }
}

function hideTermsPopup() {
  const aboutContent = document.querySelector('#content-about .about-content');
  const termsPopup = document.getElementById('terms-popup');
  
  if (aboutContent && termsPopup) {
    termsPopup.classList.remove('active');
    setTimeout(() => {
      termsPopup.style.display = 'none';
      aboutContent.style.display = 'block';
    }, 250); // Match CSS transition duration
  }
}

async function showHelpPopup() {
  const aboutContent = document.querySelector('#content-about .about-content');
  const helpPopup = document.getElementById('help-popup');
  
  if (aboutContent && helpPopup) {
    aboutContent.style.display = 'none';
    helpPopup.style.display = 'flex';
    
    // Load help guide content
    await loadContentIntoContainer('src/html/help-guide.html', 'help-content-container');
    
    // Trigger reflow and add active class for animation
    helpPopup.offsetHeight;
    helpPopup.classList.add('active');
  }
}

function hideHelpPopup() {
  const aboutContent = document.querySelector('#content-about .about-content');
  const helpPopup = document.getElementById('help-popup');
  
  if (aboutContent && helpPopup) {
    helpPopup.classList.remove('active');
    setTimeout(() => {
      helpPopup.style.display = 'none';
      aboutContent.style.display = 'block';
    }, 250); // Match CSS transition duration
  }
}

async function showDownloadPopup() {
  const aboutContent = document.querySelector('#content-about .about-content');
  const downloadPopup = document.getElementById('download-popup');
  
  if (aboutContent && downloadPopup) {
    aboutContent.style.display = 'none';
    downloadPopup.style.display = 'flex';
    
    // Load download content
    await loadContentIntoContainer('src/html/download.html', 'download-content-container');
    
    // Trigger reflow and add active class for animation
    downloadPopup.offsetHeight;
    downloadPopup.classList.add('active');
  }
}

function hideDownloadPopup() {
  const aboutContent = document.querySelector('#content-about .about-content');
  const downloadPopup = document.getElementById('download-popup');
  
  if (aboutContent && downloadPopup) {
    downloadPopup.classList.remove('active');
    setTimeout(() => {
      downloadPopup.style.display = 'none';
      aboutContent.style.display = 'block';
    }, 250); // Match CSS transition duration
  }
}

// Expose popup functions to global window scope
window.showPrivacyPopup = showPrivacyPopup;
window.hidePrivacyPopup = hidePrivacyPopup;
window.showContactPopup = showContactPopup;
window.hideContactPopup = hideContactPopup;
window.showTermsPopup = showTermsPopup;
window.hideTermsPopup = hideTermsPopup;
window.showHelpPopup = showHelpPopup;
window.hideHelpPopup = hideHelpPopup;
window.showDownloadPopup = showDownloadPopup;
window.hideDownloadPopup = hideDownloadPopup;
