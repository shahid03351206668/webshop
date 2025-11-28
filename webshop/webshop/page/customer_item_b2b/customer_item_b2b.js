frappe.pages['customer-item-b2b'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Customer Item B2B',
		single_column: true
	});
	
	wrapper = $(wrapper).find('.layout-main-section');
	wrapper.append(`
			<div class="table-container">
				<table style="width:100%;">
					<thead>
						<tr>
							<td style="text-align:left;margin-top:5px;width:5%;"><input class="checkbox-header" onchange = "on_header_check_change(this)" type="checkbox"></td>
							<td style="text-align:left;width:10%;" class='item_code'>Item Code</td>
							<td style="text-align:left;width:30%;">Item Name</td>
							<td style="text-align:left;width:20%;">Web Item No</td>
							<td style="text-align:left;width:25%;">Item Group</td>
							<td style="text-align:left;width:10%;">Brand</td>
						</tr>
					</thead>
					<tbody id="table-data">
					</tbody>
				</table>  
			</div>
		`)
	
	$('#table-data').html(`
		<tr>
			<td colspan="5" style="text-align:center;">Please select a customer</td>
		</tr>
	`);
	// Store field references
	let fields = {};
	make_field();
	let params = new URLSearchParams(window.location.search);
	if (params.get("customer")) {
		fields.customer.set_value(params.get("customer"))
	}
	function get_items(){
		// Get current values from all fields
		const customer_val = fields.customer ? fields.customer.get_value() : null;
		const item_val = fields.item_code ? fields.item_code.get_value() : null;
		const item_group_val = fields.item_group ? fields.item_group.get_value() : null;
		const brand_val = fields.brand ? fields.brand.get_value() : null;
		let checked_item_val = fields.show_selected_items ? fields.show_selected_items.get_value(): null

		// Customer is required, don't call if empty
		if (!customer_val) {
			$('#table-data').html(`
				<tr>
					<td colspan="6" style="text-align:center;">Please select a customer</td>
				</tr>
			`);
			return;
		}
		
		frappe.call({
			method:"webshop.webshop.page.customer_item_b2b.customer_item_b2b.get_items",
			args:{
				customer: customer_val,
				item: item_val,
				item_group: item_group_val,
				brand: brand_val,
				check: cint(checked_item_val)
			},
			callback:function(res){
				let data = res.message;
				let table_html = "";
				if(data && data.length > 0){
					// frappe.msgprint(cstr(frappe.get_route()))
					// console.log(data)					
					for(let row of data){
						const checked = row['checked'] == 1 ? 'checked' : '';
						table_html += `
							<tr>
								<td style="text-align:left;"><input class="checkbox" type="checkbox" ${checked}></td>
								<td style="text-align:left;" onclick="on_item_click(this)">${row.name}</td>
								<td style="text-align:left;">${row.item_name}</td>
								<td style="text-align:left;" onclick="on_webitem_click(this)">${row.website_item || ""}</td>
								<td style="text-align:left;">${row.item_group}</td>
								<td style="text-align:left;">${row.brand || ""}</td>
							</tr>
						`
					}
				}
				else{
					table_html += `
						<tr>
							<td colspan="6" style="text-align:center;">No Data Found</td>
						</tr>
					`
				}
				$('#table-data').html(table_html)
			}
		})
	}

	
	
	function make_field(){
		fields.customer = page.add_field({
			label: 'Customer',
			fieldtype: 'Link',
			fieldname: 'customer',
			reqd: 1,
			options: "Customer",
			change() {
				get_items();
			}
		});
		
		fields.item_code = page.add_field({
			label: 'Item',
			fieldtype: 'Link',
			fieldname: 'item',
			options: "Item",
			change() {
				get_items();
			}
		});
		
		fields.item_group = page.add_field({
			label: 'Item Group',
			fieldtype: 'Link',
			fieldname: 'item_group',
			options: "Item Group",
			change() {
				get_items();
			}
		});
		
		fields.brand = page.add_field({
			label: 'Brand',
			fieldtype: 'Link',
			fieldname: 'brand',
			options: "Brand",
			change() {
				get_items();
			}
		});
		
		fields.show_selected_items = page.add_field({
			label: 'Show Selected Items',
			fieldtype: 'Check',
			fieldname: 'show_selected_items',
			change() {
				get_items();
			}
		});

	} 
	function update_items(){
		const CheckedItems = [];
		let table_data = document.querySelector('#table-data');
		if (table_data) {
			let allrows = table_data.querySelectorAll('tr');
			// console.log('Total rows:', allrows.length);		
			allrows.forEach((row, index) => {
				const checkbox = row.querySelector('input[type="checkbox"].checkbox');
				
				if (checkbox && checkbox.checked) {
					const cells = row.getElementsByTagName('td');
					if (cells.length > 0) {
						const item_code = cells[1].textContent.trim();
						if (item_code) {
							CheckedItems.push(item_code);
							// console.log(`Row ${index}: ${item_code} is checked`);
						}
					}
				}
			});
		}
		// console.log('Checked Items:', CheckedItems);
		frappe.call({
			method:"webshop.webshop.page.customer_item_b2b.customer_item_b2b.update_items",
			args:{
				customer:fields.customer.get_value(),
				updated_items:CheckedItems
			},
			callback:function(res){
				let data = res.message;
				if(data){
					frappe.msgprint({message:`Customer ${fields.customer.get_value()} Updated Successfully`, indicator:"green"})
				}
				else{
					frappe.msgprint({message:`Error Updating ${fields.customer.get_value()}`, indicator:"red"})
				}
			}

		})
	}
	let save_button = page.set_primary_action('Save', ()=>update_items())
}

function on_header_check_change(element){
	// console.log(element)
	const table_data = document.getElementById('table-data');
	const checkbox_header = document.querySelector('.checkbox-header');
	if (!table_data) {
		console.error('table-data not found');
		return;
	}
	
	if (!checkbox_header) {
		console.error('checkbox-header not found');
		return;
	}
	if (table_data && checkbox_header.checked){
		let allrows = table_data.querySelectorAll('tr');
		allrows.forEach((row, index)=>{
			const checkbox = row.querySelector('input[type="checkbox"].checkbox');
			// console.log(checkbox.checked)
			checkbox.checked = true;
			// if (!checkbox.checked){
			// }
		})	
	}
	else if(!checkbox_header.checked){
		let allrows = table_data.querySelectorAll('tr');
		allrows.forEach((row, index)=>{
			const checkbox = row.querySelector('input[type="checkbox"].checkbox');
			// console.log(checkbox.checked)
			checkbox.checked = false;
			// if (!checkbox.checked){
			// }
		})	
	}
}

function set_item_route(item, webitem){
	if (item){
		frappe.set_route(['Form', 'Item', cstr(item)]);
	}
	else if(webitem){
		frappe.set_route(['Form', 'Website Item', cstr(webitem)]);
	}
}

function on_item_click(item){
	console.warn(item);
	let item_code = item.textContent;
	// console.log(item_code)
	set_item_route(item_code, undefined)
}
function on_webitem_click(item){
	console.warn(item);
	let item_code = item.textContent
	// console.log(item_code)
	set_item_route(undefined, item_code)
}