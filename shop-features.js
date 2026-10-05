(() => {
    const CART_KEY = "diamond-cart-v1";
    const REVIEW_KEY_PREFIX = "diamond-reviews-v1-";
    const formatPrice = (price) => `$${price.toFixed(2)}`;

    const createElement = (tagName, className, text) => {
        const element = document.createElement(tagName);
        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;
        return element;
    };

    const notice = createElement("p", "shop-feature-notice");
    notice.setAttribute("role", "status");
    notice.setAttribute("aria-live", "polite");
    document.body.append(notice);

    let noticeTimeout;
    const showNotice = (message) => {
        notice.textContent = message;
        notice.classList.add("is-visible");
        window.clearTimeout(noticeTimeout);
        noticeTimeout = window.setTimeout(() => notice.classList.remove("is-visible"), 3500);
    };

    const readStorage = (key, fallback) => {
        try {
            const value = localStorage.getItem(key);
            return value === null ? fallback : JSON.parse(value);
        } catch (error) {
            showNotice("Saved shopping data could not be read in this browser.");
            console.error("Unable to read saved shop data.", error);
            return fallback;
        }
    };

    const writeStorage = (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            showNotice("Could not save changes. Check this browser's storage settings.");
            console.error("Unable to save shop data.", error);
            return false;
        }
    };

    const readCart = () => {
        const cart = readStorage(CART_KEY, []);
        if (!Array.isArray(cart) || !cart.every((item) =>
            item && typeof item.id === "string" && typeof item.name === "string" &&
            Number.isFinite(item.price) && Number.isInteger(item.quantity) && item.quantity > 0
        )) {
            showNotice("Saved cart data is invalid and could not be loaded.");
            return [];
        }
        return cart;
    };

    let cart = readCart();
    const header = document.querySelector(".shop-header-inner, .product-header");
    const cartButton = createElement("button", "cart-toggle");
    cartButton.type = "button";
    cartButton.setAttribute("aria-haspopup", "dialog");
    cartButton.setAttribute("aria-label", "Open shopping cart");
    header.append(cartButton);

    const cartOverlay = createElement("div", "cart-overlay");
    cartOverlay.hidden = true;
    const cartDialog = createElement("section", "cart-dialog");
    cartDialog.setAttribute("role", "dialog");
    cartDialog.setAttribute("aria-modal", "true");
    cartDialog.setAttribute("aria-labelledby", "cart-title");

    const cartHeading = createElement("div", "cart-heading");
    const cartTitle = createElement("h2", "", "Your cart");
    cartTitle.id = "cart-title";
    const closeCart = createElement("button", "cart-close", "Close");
    closeCart.type = "button";
    closeCart.setAttribute("aria-label", "Close shopping cart");
    cartHeading.append(cartTitle, closeCart);
    const cartItems = createElement("div", "cart-items");
    const cartFooter = createElement("div", "cart-footer");
    const cartTotal = createElement("p", "cart-total");
    const cartNote = createElement("p", "cart-note", "Demo store: checkout is not connected.");
    const payButton = createElement("button", "cart-pay-button", "Pay now");
    payButton.type = "button";
    payButton.disabled = true;
    cartFooter.append(cartTotal, cartNote, payButton);
    cartDialog.append(cartHeading, cartItems, cartFooter);
    cartOverlay.append(cartDialog);
    document.body.append(cartOverlay);

    const saveCart = () => writeStorage(CART_KEY, cart);
    const updateCartButton = () => {
        const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
        cartButton.textContent = `Cart (${itemCount})`;
        payButton.disabled = itemCount === 0;
    };

    const renderCart = () => {
        cartItems.replaceChildren();
        if (cart.length === 0) {
            cartItems.append(createElement("p", "cart-empty", "Your cart is empty."));
            cartTotal.textContent = "Total: $0.00";
            updateCartButton();
            return;
        }

        let total = 0;
        cart.forEach((item) => {
            total += item.price * item.quantity;
            const row = createElement("article", "cart-item");
            if (typeof item.image === "string" && item.image) {
                const image = createElement("img", "cart-item-image");
                image.src = item.image;
                image.alt = item.name;
                image.loading = "lazy";
                row.append(image);
            }
            const itemCopy = createElement("div", "cart-item-copy");
            itemCopy.append(
                createElement("h3", "", item.name),
                createElement("p", "", `Size Asia ${item.size || "—"}`),
                createElement("p", "", `${formatPrice(item.price)} each`)
            );
            const controls = createElement("div", "cart-item-controls");
            const decrease = createElement("button", "cart-quantity-button", "−");
            decrease.type = "button";
            decrease.dataset.cartAction = "decrease";
            decrease.dataset.cartId = item.id;
            decrease.setAttribute("aria-label", `Decrease quantity of ${item.name}`);
            const quantity = createElement("span", "cart-quantity", String(item.quantity));
            const increase = createElement("button", "cart-quantity-button", "+");
            increase.type = "button";
            increase.dataset.cartAction = "increase";
            increase.dataset.cartId = item.id;
            increase.setAttribute("aria-label", `Increase quantity of ${item.name}`);
            const remove = createElement("button", "cart-remove", "Remove");
            remove.type = "button";
            remove.dataset.cartAction = "remove";
            remove.dataset.cartId = item.id;
            controls.append(decrease, quantity, increase, remove);
            row.append(itemCopy, controls);
            cartItems.append(row);
        });
        cartTotal.textContent = `Total: ${formatPrice(total)}`;
        updateCartButton();
    };

    updateCartButton();

    const openCart = () => {
        renderCart();
        cartOverlay.hidden = false;
        closeCart.focus();
    };
    const dismissCart = () => {
        cartOverlay.hidden = true;
        cartButton.focus();
    };

    cartButton.addEventListener("click", openCart);
    closeCart.addEventListener("click", dismissCart);
    payButton.addEventListener("click", () => {
        if (cart.length > 0) showNotice("Demo only: no payment was processed.");
    });
    cartOverlay.addEventListener("click", (event) => {
        if (event.target === cartOverlay) dismissCart();
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !cartOverlay.hidden) dismissCart();
    });
    cartItems.addEventListener("click", (event) => {
        const button = event.target.closest("[data-cart-action]");
        if (!button) return;
        const item = cart.find((entry) => entry.id === button.dataset.cartId);
        if (!item) return;
        if (button.dataset.cartAction === "increase") item.quantity += 1;
        if (button.dataset.cartAction === "decrease") item.quantity -= 1;
        if (button.dataset.cartAction === "remove" || item.quantity < 1) {
            cart = cart.filter((entry) => entry.id !== button.dataset.cartId);
        }
        if (saveCart()) renderCart();
    });

    const addToCart = (item) => {
        const current = cart.find((entry) => entry.id === item.id);
        if (current) current.quantity += 1;
        else cart.push({ ...item, quantity: 1 });
        if (saveCart()) {
            updateCartButton();
            showNotice(`${item.name} added to your cart.`);
            return true;
        }
        return false;
    };

    const slugify = (value) => String(value ?? "product")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "product";

    const getProductVariant = (link) => {
        try {
            const url = new URL(link.href, window.location.href);
            return url.searchParams.get("variant");
        } catch (error) {
            return null;
        }
    };

    const createProductId = (name, variant) => {
        const safeVariant = typeof variant === "string" ? variant.trim() : "";
        return safeVariant ? `variant-${safeVariant}` : `product-${slugify(name)}`;
    };

    const createSizeSelector = () => {
        const label = createElement("label", "shoe-size-label", "Size (Asia)");
        const select = createElement("select", "shoe-size-select");
        select.setAttribute("aria-label", "Choose shoe size (Asia)");
        select.required = true;
        const placeholder = createElement("option", "", "Choose size");
        placeholder.value = "";
        placeholder.selected = true;
        placeholder.disabled = true;
        select.append(placeholder);
        for (let size = 38; size <= 47; size += 1) {
            const option = createElement("option", "", String(size));
            option.value = String(size);
            select.append(option);
        }
        label.append(select);
        return select;
    };

    const makeCartItem = (product, size) => ({
        ...product,
        id: `${createProductId(product.name, product.variant)}-size-${size}`,
        size,
    });

    const selectedSize = (select) => {
        if (!select.value) {
            showNotice("Please choose a shoe size first.");
            select.focus();
            return null;
        }
        return select.value;
    };

    document.querySelectorAll(".shoe-card").forEach((card) => {
        const detailsLink = card.querySelector(".shoe-details-link");
        const variant = getProductVariant(detailsLink);
        const productName = card.querySelector("h2").textContent.trim();
        const productPrice = Number(card.querySelector(".shoe-price").textContent.match(/\$([\d.]+)/)?.[1]);
        const sizeSelect = createSizeSelector();
        const addButton = createElement("button", "shoe-add-button", "Add to cart");
        addButton.type = "button";
        const buyButton = createElement("button", "shoe-buy-button", "Buy now");
        buyButton.type = "button";
        const item = {
            id: createProductId(productName, variant),
            name: productName,
            price: productPrice,
            image: card.querySelector("img").src,
            variant,
        };
        addButton.addEventListener("click", () => {
            const size = selectedSize(sizeSelect);
            if (size) addToCart(makeCartItem(item, size));
        });
        buyButton.addEventListener("click", () => {
            const size = selectedSize(sizeSelect);
            if (size && addToCart(makeCartItem(item, size))) openCart();
        });
        const actions = createElement("div", "shoe-card-actions");
        actions.append(sizeSelect.closest("label"), addButton, buyButton);
        card.querySelector(".shoe-card-content").append(actions);
    });

    const productTitle = document.querySelector("#product-title");
    if (productTitle) {
        const variant = new URLSearchParams(window.location.search).get("variant") || "1";
        const currentPrice = Number(document.querySelector(".product-detail-current-price").textContent.replace(/[^0-9.]/g, ""));
        const sizeSelect = createSizeSelector();
        const addButton = createElement("button", "product-add-button", "Add to cart");
        addButton.type = "button";
        const buyButton = createElement("button", "product-buy-button", "Buy now");
        buyButton.type = "button";
        const product = {
            id: createProductId(productTitle.textContent, variant),
            name: productTitle.textContent,
            price: currentPrice,
            image: document.querySelector(".product-detail-image").src,
            variant,
        };
        addButton.addEventListener("click", () => {
            const size = selectedSize(sizeSelect);
            if (size) addToCart(makeCartItem(product, size));
        });
        buyButton.addEventListener("click", () => {
            const size = selectedSize(sizeSelect);
            if (size && addToCart(makeCartItem(product, size))) openCart();
        });
        const productActions = createElement("div", "product-actions");
        productActions.append(sizeSelect.closest("label"), addButton, buyButton);
        document.querySelector(".product-detail-copy").append(productActions);

        const reviewSection = createElement("section", "product-reviews");
        reviewSection.setAttribute("aria-labelledby", "reviews-title");
        const reviewsHeading = createElement("h2", "", "Customer comments");
        reviewsHeading.id = "reviews-title";
        const reviewNote = createElement("p", "review-note", "Comments are saved only in this browser.");
        const reviewList = createElement("div", "review-list");
        const reviewForm = createElement("form", "review-form");
        const nameLabel = createElement("label", "", "Name (optional)");
        const nameInput = createElement("input");
        nameInput.name = "reviewer";
        nameInput.maxLength = 50;
        nameInput.autocomplete = "name";
        nameLabel.append(nameInput);
        const ratingLabel = createElement("label", "", "Rating");
        const ratingSelect = createElement("select");
        ratingSelect.name = "rating";
        ratingSelect.required = true;
        for (let rating = 5; rating >= 1; rating -= 1) {
            const option = createElement("option", "", `${rating} star${rating === 1 ? "" : "s"}`);
            option.value = String(rating);
            ratingSelect.append(option);
        }
        ratingLabel.append(ratingSelect);
        const commentLabel = createElement("label", "", "Comment");
        const commentInput = createElement("textarea");
        commentInput.name = "comment";
        commentInput.required = true;
        commentInput.maxLength = 500;
        commentInput.rows = 4;
        commentInput.placeholder = "Share your thoughts about this shoe...";
        commentLabel.append(commentInput);
        const submitReview = createElement("button", "review-submit", "Post comment");
        submitReview.type = "submit";
        const reviewStatus = createElement("p", "review-status");
        reviewStatus.setAttribute("role", "status");
        reviewForm.append(nameLabel, ratingLabel, commentLabel, submitReview, reviewStatus);
        reviewSection.append(reviewsHeading, reviewNote, reviewList, reviewForm);
        document.querySelector(".product-details").insertAdjacentElement("afterend", reviewSection);

        const reviewKey = `${REVIEW_KEY_PREFIX}${variant}`;
        const readReviews = () => {
            const reviews = readStorage(reviewKey, []);
            return Array.isArray(reviews) ? reviews.filter((review) =>
                review && typeof review.comment === "string" &&
                Number.isInteger(review.rating) && review.rating >= 1 && review.rating <= 5 &&
                typeof review.date === "string"
            ) : [];
        };
        const renderReviews = () => {
            reviewList.replaceChildren();
            const reviews = readReviews();
            if (reviews.length === 0) {
                reviewList.append(createElement("p", "review-empty", "No comments yet. Be the first to share one."));
                return;
            }
            reviews.slice().reverse().forEach((review) => {
                const entry = createElement("article", "review-entry");
                const heading = createElement("div", "review-entry-heading");
                heading.append(
                    createElement("strong", "", review.name || "Guest"),
                    createElement("span", "review-rating", `${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}`)
                );
                entry.append(
                    heading,
                    createElement("p", "review-date", review.date),
                    createElement("p", "review-comment", review.comment)
                );
                reviewList.append(entry);
            });
        };
        reviewForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const comment = commentInput.value.trim();
            if (!comment) {
                reviewStatus.textContent = "Please enter a comment before posting.";
                return;
            }
            const reviews = readReviews();
            reviews.push({
                name: nameInput.value.trim().slice(0, 50),
                rating: Number(ratingSelect.value),
                comment: comment.slice(0, 500),
                date: new Date().toLocaleDateString(),
            });
            if (writeStorage(reviewKey, reviews)) {
                reviewForm.reset();
                reviewStatus.textContent = "Your comment was saved in this browser.";
                renderReviews();
            }
        });
        renderReviews();
    }

    const chatToggle = createElement("button", "help-toggle", "Help");
    chatToggle.type = "button";
    chatToggle.setAttribute("aria-expanded", "false");
    chatToggle.setAttribute("aria-controls", "help-panel");
    const helpPanel = createElement("section", "help-panel");
    helpPanel.id = "help-panel";
    helpPanel.hidden = true;
    helpPanel.setAttribute("aria-label", "DIAMOND quick help");
    const helpHeader = createElement("div", "help-header");
    const helpTitle = createElement("h2", "", "DIAMOND Help");
    const helpClose = createElement("button", "help-close", "×");
    helpClose.type = "button";
    helpClose.setAttribute("aria-label", "Close help");
    helpHeader.append(helpTitle, helpClose);
    const chatMessages = createElement("div", "help-messages");
    chatMessages.setAttribute("aria-live", "polite");
    chatMessages.append(createElement("p", "help-answer", "Hi! I can answer quick questions about this demo shop. Choose a topic below. This is an automated helper, not live chat."));
    const topicList = createElement("div", "help-topics");
    [
        ["Shipping", "This demo shop has no connected shipping or order service yet."],
        ["Sizing", "Check the shoe brand's sizing guide before ordering; sizing can vary by model."],
        ["Returns", "Returns are not set up in this demo shop. No real orders can be placed here."],
        ["Cart", "Your cart is saved in this browser. Open Cart to change quantities or remove items."],
    ].forEach(([topic, answer]) => {
        const button = createElement("button", "help-topic", topic);
        button.type = "button";
        button.addEventListener("click", () => {
            chatMessages.append(createElement("p", "help-question", topic));
            chatMessages.append(createElement("p", "help-answer", answer));
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
        topicList.append(button);
    });
    helpPanel.append(helpHeader, chatMessages, topicList);
    document.body.append(helpPanel, chatToggle);
    const setHelpOpen = (isOpen) => {
        helpPanel.hidden = !isOpen;
        chatToggle.setAttribute("aria-expanded", String(isOpen));
        if (isOpen) helpClose.focus();
        else chatToggle.focus();
    };
    chatToggle.addEventListener("click", () => setHelpOpen(helpPanel.hidden));
    helpClose.addEventListener("click", () => setHelpOpen(false));

    updateCartButton();
})();
