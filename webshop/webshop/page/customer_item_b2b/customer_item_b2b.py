import frappe
from frappe.utils import flt, cstr
import json


@frappe.whitelist()
def get_items(customer=None, item=None, item_group=None, brand=None):
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
	customer_items_query = frappe.db.sql(f"""SELECT item FROM `tabCustomer Items B2B` WHERE parent = '{customer}' """, as_dict=1) or []
	customer_items = [r.item for r in customer_items_query]
	for item in items:
		item['checked'] = 0
		if item.get('name') in customer_items:
			item['checked'] = 1
	return items

@frappe.whitelist()
def update_items(customer, updated_items):
	# frappe.throw(cstr(customer))
	# if customer:
	# 	customer = json.loads(customer)
	if updated_items:
		updated_items = json.loads(updated_items)
	try:
		if customer and len(updated_items) > 0:
			doc = frappe.get_doc("Customer", customer)
			doc.custom_customer_items_b2b = []
			for item in updated_items:	
				doc.append("custom_customer_items_b2b", {
					"item":	item
				})
			doc.save()
			return True
	except Exception as e:
		return False
