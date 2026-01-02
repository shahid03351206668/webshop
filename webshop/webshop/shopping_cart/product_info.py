# Copyright (c) 2021, Frappe Technologies Pvt. Ltd. and Contributors
# License: GNU General Public License v3. See license.txt

import frappe
from frappe.utils import nowdate, fmt_money, flt

from webshop.webshop.doctype.webshop_settings.webshop_settings import (
    get_shopping_cart_settings,
    show_quantity_in_website,
)
from webshop.webshop.shopping_cart.cart import _get_cart_quotation, _set_price_list
from erpnext.utilities.product import get_price
from webshop.webshop.utils.product import (
    get_non_stock_item_status,
    get_web_item_qty_in_stock,
)
from webshop.webshop.shopping_cart.cart import get_party


@frappe.whitelist(allow_guest=True)
def get_product_info_for_website(item_code, skip_quotation_creation=False):
    """
    Get product price / stock info for website
    """

    cart_settings = get_shopping_cart_settings()
    if not cart_settings.enabled:
        # return settings even if cart is disabled
        return frappe._dict({"product_info": {}, "cart_settings": cart_settings})

    cart_quotation = frappe._dict()
    if not skip_quotation_creation:
        cart_quotation = _get_cart_quotation()

    # selling_price_list = (
    #     cart_quotation.get("selling_price_list")
    #     if cart_quotation
    #     else _set_price_list(cart_settings, None)
    # )


    selling_price_list = cart_settings.get("price_list")

    price = {}
    if cart_settings.show_price:
        is_guest = frappe.session.user == "Guest"
        party = get_party()
        # Show Price if logged in.
        # If not logged in, check if price is hidden for guest.
        today = nowdate()
        
        if not is_guest or not cart_settings.hide_price_for_guest:
            item_price = frappe.db.sql(
                f"""
				SELECT
					ip.price_list_rate,
					ip.currency,
					c.symbol as currency_symbol
				FROM `tabItem Price` ip
				INNER JOIN `tabCurrency` c 
					ON c.name = ip.currency
				WHERE ip.item_code = {frappe.db.escape(item_code)}
				AND ip.price_list = {frappe.db.escape(selling_price_list)}  
				AND (ip.valid_from IS NULL OR ip.valid_from <= {frappe.db.escape(today)})
				AND (ip.valid_upto IS NULL OR ip.valid_upto >= {frappe.db.escape(today)})
				AND ip.customer = {frappe.db.escape(party.name)}
				""",
                as_dict=True,
                debug=True,
            )
            frappe.throw(str(item_price))
            if item_price:
                item_price = item_price[0]
                price = {
                    **item_price,
                    "formatted_price_sales_uom": fmt_money(
                        flt(item_price.get("price_list_rate")),
                        currency=item_price.get("currency_symbol"),
                    ),
                    "formatted_price": fmt_money(
                        flt(item_price.get("price_list_rate")),
                        currency=item_price.get("currency_symbol"),
                    ),
                }

            else:
                if party:
                    default_price_list = frappe.db.sql(f"""SELECT default_price_list FROM `tabCustomer` WHERE name = {frappe.db.escape(party.name)}""", as_dict=1)
                    if default_price_list:
                        selling_price_list = default_price_list[0].get("default_price_list")
                price = get_price(
                    item_code,
                    selling_price_list,
                    cart_settings.default_customer_group,
                    cart_settings.company,
                    party=party,
                )

    stock_status = None

    if cart_settings.show_stock_availability:
        on_backorder = frappe.get_cached_value(
            "Website Item", {"item_code": item_code}, "on_backorder"
        )
        if on_backorder:
            stock_status = frappe._dict({"on_backorder": True})
        else:
            stock_status = get_web_item_qty_in_stock(item_code, "website_warehouse")

    product_info = {
        "price": price,
        "qty": 0,
        "uom": frappe.db.get_value("Item", item_code, "stock_uom"),
        "sales_uom": frappe.db.get_value("Item", item_code, "sales_uom"),
    }

    if stock_status:
        if stock_status.on_backorder:
            product_info["on_backorder"] = True
        else:
            product_info["stock_qty"] = stock_status.stock_qty
            product_info["in_stock"] = (
                stock_status.in_stock
                if stock_status.is_stock_item
                else get_non_stock_item_status(item_code, "website_warehouse")
            )
            product_info["show_stock_qty"] = show_quantity_in_website()

    if product_info["price"]:
        if frappe.session.user != "Guest":
            item = cart_quotation.get({"item_code": item_code}) if cart_quotation else None
            if item:
                product_info["qty"] = item[0].qty

    return frappe._dict({"product_info": product_info, "cart_settings": cart_settings})


def set_product_info_for_website(item):
    """set product price uom for website"""
    product_info = get_product_info_for_website(item.item_code, skip_quotation_creation=True).get(
        "product_info"
    )

    if product_info:
        item.update(product_info)
        item["stock_uom"] = product_info.get("uom")
        item["sales_uom"] = product_info.get("sales_uom")
        if product_info.get("price"):
            item["price_stock_uom"] = product_info.get("price").get("formatted_price")
            item["price_sales_uom"] = product_info.get("price").get("formatted_price_sales_uom")
        else:
            item["price_stock_uom"] = ""
            item["price_sales_uom"] = ""
