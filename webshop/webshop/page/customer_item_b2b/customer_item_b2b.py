import frappe
from frappe.utils import flt, cstr, cint
import json


@frappe.whitelist()
def get_items(customer=None, item=None, item_group=None, brand=None, check=None):
	item_conds = ""
	if item:
		item_conds += f""" and name = '{item}'"""
	if item_group:
		item_conds += f""" and item_group = '{item_group}'"""
	if brand:
		item_conds += f""" and brand = '{brand}'"""
	items = frappe.db.sql(f"""
		SELECT 
		name, 
		item_name, 
		item_group, 
		brand
		FROM `tabItem`  
		WHERE is_sales_item = 1 AND disabled = 0
		{item_conds}
	""", as_dict=1)
	customer_items_query = frappe.db.sql(f"""SELECT item FROM `tabCustomer Items B2B` WHERE parent = '{customer}'""", as_dict=1) or []
	customer_items = [r.item for r in customer_items_query]
	for item in items:
		item_name = item.get('name')
		item['checked'] = 0
		if item_name in customer_items:
			item['checked'] = 1
		website_item = frappe.db.sql(f"""SELECT name FROM `tabWebsite Item` WHERE item_code = '{item_name}' LIMIT 1""", as_dict=1)
		if website_item:
			item['website_item'] = website_item[0].get("name")
	if cint(check):
		items = [i for i in items if i.get('checked')]
	return items

@frappe.whitelist()
def update_items(customer, updated_items):
	# frappe.throw(cstr(customer))
	# if customer:
	# 	customer = json.loads(customer)
	if updated_items:
		updated_items = json.loads(updated_items)
	try:
		if customer:
			doc = frappe.get_doc("Customer", customer)
			doc.custom_customer_items_b2b = []
			if len(updated_items) > 0:
				for item in updated_items:
					website_item = frappe.db.sql(f"""SELECT name FROM `tabWebsite Item` WHERE item_code = '{item}' LIMIT 1""", as_dict=1) or [{"name":None}]
					if website_item:
						website_item_name = website_item[0].get("name")
					doc.append("custom_customer_items_b2b", {
						"item":	item,
						"website_item": website_item_name
					})
			doc.save()
			return True
	except Exception as e:
		return False
