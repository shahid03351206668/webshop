# Copyright (c) 2026, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from urllib.parse import quote
from frappe.utils import get_url, cint
from frappe.website.website_generator import WebsiteGenerator
from webshop.webshop.product_data_engine.filters import ProductFiltersBuilder


class WebsiteCategory(WebsiteGenerator):
	website = frappe._dict(
		template="templates/generators/website_category.html",
		no_cache=1,
		no_breadcrumbs=1,
	)

	def validate(self):
		self.make_route()

	def make_route(self):
		if self.route:
			return
		self.route = self.scrub(self.website_category)
		return self.route

	def get_context(self, context):
		context.show_search = True
		context.body_class = "product-page"
		context.page_length = (
			cint(frappe.db.get_single_value("Webshop Settings", "products_per_page")) or 6
		)
		context.search_link = "/product_search"
		filter_engine = ProductFiltersBuilder(website_category=self.name)
		context.field_filters = filter_engine.get_field_filters()
		context.attribute_filters = filter_engine.get_attribute_filters()
		context.update({"title": self.name})
		context.no_breadcrumbs = False
		context.title = self.name
		context.name = self.name
		return context

	def has_website_permission(self, ptype, user, verbose=False):
		return ptype == "read"

def get_item_for_list_in_html(context):
	# add missing absolute link in files
	# user may forget it during upload
	if (context.get("website_image") or "").startswith("files/"):
		context["website_image"] = "/" + quote(context["website_image"])
	products_template = "templates/includes/products_as_list.html"
	return frappe.get_template(products_template).render(context)