import frappe

def validate_portal_user(self):
    for user in self.portal_users:
        exists = frappe.db.exists("Portal User", {"user": user.get("user"), "parent":["!=", self.name]}) or False
        if exists:
            frappe.throw("This User is Already Linked with Another Master")

def customer_validate(self, method=None):
    validate_portal_user(self)

def customer_before_save(self, method=None):
    validate_portal_user(self)

def customer_before_insert(self, method=None):
    validate_portal_user(self)