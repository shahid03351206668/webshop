frappe.ui.form.on('Customer', {
	refresh(frm) {
		update_action(frm)
	}
})

function update_action(frm){
    if(!frm.doc.__islocal){
        frm.add_custom_button(__('Customer Item B2B Table'), ()=>{
            console.log("button clicked")
        }, __("Actions"))
    }
}