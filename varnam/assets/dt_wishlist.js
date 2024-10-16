
const LOCAL_STORAGE_WISHLIST_KEY = 'shopify-wishlist';
const LOCAL_STORAGE_DELIMITER = ',';
const BUTTON_ACTIVE_CLASS = 'added';
const GRID_LOADED_CLASS = 'loaded';

const selectors = {
  button: '[button-wishlist]',
  grid: '[grid-wishlist]',
  productCard: '.wishlist__grid-item',
};

document.addEventListener('DOMContentLoaded', () => {
  initButtons();
  initGrid();
});

document.addEventListener('shopify-wishlist:updated', (event) => {
  initGrid();
});

const fetchProductCardHTML = (handle) => {
  const productTileTemplateUrl = `/products/${handle}?view=card`;
  return fetch(productTileTemplateUrl)
  .then((res) => res.text())
  .then((res) => {
    const text = res;
    const parser = new DOMParser();
    const htmlDocument = parser.parseFromString(text, 'text/html');
    const productCard = htmlDocument.documentElement.querySelector(selectors.productCard);
    return productCard.outerHTML;
  })
  .catch((err) => console.error(`[Shopify Wishlist] Failed to load content for handle: ${handle}`, err));
};

const setupGrid = async (grid) => {
  const wishlist = getWishlist();
  const requests = wishlist.map(fetchProductCardHTML);
  const responses = await Promise.all(requests);
  const wishlistProductCards = responses.join('');
  grid.innerHTML = wishlistProductCards;
  grid.classList.add(GRID_LOADED_CLASS);
  initButtons();

  const event = new CustomEvent('shopify-wishlist:init-product-grid', {
    detail: { wishlist: wishlist }
  });
  document.dispatchEvent(event);
};

const setupButtons = (buttons) => {
  buttons.forEach((button) => {
    const productHandle = button.dataset.productHandle || false;
    if (!productHandle) return console.error('[Shopify Wishlist] Missing `data-product-handle` attribute. Failed to update the wishlist.');
    if (wishlistContains(productHandle)) button.classList.add(BUTTON_ACTIVE_CLASS);
    button.addEventListener('click', () => {
      updateWishlist(productHandle);
      button.classList.toggle(BUTTON_ACTIVE_CLASS);
    });
  });
};

const initGrid = () => {
  const grid = document.querySelector(selectors.grid) || false;
  if (grid) setupGrid(grid);
  wishListCount();
};

const initButtons = () => {
  const buttons = document.querySelectorAll(selectors.button) || [];
  if (buttons.length) setupButtons(buttons);
  else return;
  const event = new CustomEvent('shopify-wishlist:init-buttons', {
    detail: { wishlist: getWishlist() }
  });
  document.dispatchEvent(event);
};

const getWishlist = () => {
  const wishlist = localStorage.getItem(LOCAL_STORAGE_WISHLIST_KEY) || false;
  if (wishlist) return wishlist.split(LOCAL_STORAGE_DELIMITER);
  return [];
};

const setWishlist = (array) => {
  const wishlist = array.join(LOCAL_STORAGE_DELIMITER);
  if (array.length) localStorage.setItem(LOCAL_STORAGE_WISHLIST_KEY, wishlist);
  else localStorage.removeItem(LOCAL_STORAGE_WISHLIST_KEY);

  const event = new CustomEvent('shopify-wishlist:updated', {
    detail: { wishlist: array }
  });
  document.dispatchEvent(event);

  return wishlist;
};

const updateWishlist = (handle) => {
  const wishlist = getWishlist();
  const indexInWishlist = wishlist.indexOf(handle);
  let count = 0;
   if (indexInWishlist === -1) {
    wishlist.push(handle);
    count = 1;
  } else {
    wishlist.splice(indexInWishlist, 1);
    count = -1;
  }
  setWishlist(wishlist);    
  wishListCount(); 
};

const wishlistContains = (handle) => {
  const wishlist = getWishlist();
  return wishlist.includes(handle);
};

const resetWishlist = () => {
  return setWishlist([]);
};


const wishListCount = (handle) => {
  const currentCount = getWishlist().length;  
  const wishCount = document.querySelector('.wishlist-count-bubble');
  if(!wishCount) return;
  wishCount.querySelector("span").innerHTML = currentCount;  
  const wishContainer = document.getElementById('wishlist');
  if(currentCount === 0){   
    document.querySelectorAll(".dtxc-wishlist-count").forEach(countBubble => { countBubble.style.display = "none" })    
    setTimeout(() => {
    if(!wishContainer) return; 
   if (wishContainer && wishContainer.querySelector('.wishlist__grid')) {
    wishContainer.querySelector('.wishlist__grid').innerHTML = "Your wishlist looks empty";
    wishContainer.querySelector('.wishlist__grid').classList.add('empty-list');
  } else {
    console.error('Error: wishlist container or grid not found');
  }
}, 1000);
  }   
  else {
     document.querySelectorAll(".dtxc-wishlist-count").forEach(countBubble => { countBubble.style.display = "block" })     
   }
};



