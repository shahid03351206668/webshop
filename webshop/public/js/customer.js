frappe.ui.form.on('Customer', {
	refresh(frm) {
		update_action(frm)
	}
})

function update_action(frm){
    if(!frm.doc.__islocal){
        frm.add_custom_button(__('Customer Item B2B Table'), ()=>{
            let params = new URLSearchParams(`customer=${frm.doc.name}`);
            window.location.href = `/app/customer-item-b2b?${params.toString()}`
        }, __("Actions"))
    }
}