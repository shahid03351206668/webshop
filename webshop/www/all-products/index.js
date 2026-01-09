$(() => {
	class ProductListing {
		constructor() {
			let me = this;
			let is_item_group_page = $(".item-group-content").data("item-group");
			let is_website_category_page = $(".item-website-category-content").data("website-category");
			this.item_group = is_item_group_page || null;
			this.website_category = is_website_category_page || null;
			let view_type = localStorage.getItem("product_view") || "List View";

			// Render Product Views, Filters & Search
			new webshop.ProductView({
				view_type: view_type,
				products_section: $('#product-listing'),
				item_group: me.item_group,
				website_category: me.website_category,
			});

			this.bind_card_actions();
		}

		bind_card_actions() {
			webshop.webshop.shopping_cart.bind_add_to_cart_action();
			webshop.webshop.wishlist.bind_wishlist_action();
		}
	}

	new ProductListing();
});
