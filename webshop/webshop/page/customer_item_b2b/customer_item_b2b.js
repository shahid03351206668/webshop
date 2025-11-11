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
							<td style="text-align:center;"></td>
							<td style="text-align:center;class='item_code'">Item Code</td>
							<td style="text-align:center;">Item Name</td>
							<td style="text-align:center;">Item Group</td>
							<td style="text-align:center;">Brand</td>
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
	
	function get_items(){
		// Get current values from all fields
		const customer_val = fields.customer ? fields.customer.get_value() : null;
		const item_val = fields.item_code ? fields.item_code.get_value() : null;
		const item_group_val = fields.item_group ? fields.item_group.get_value() : null;
		const brand_val = fields.brand ? fields.brand.get_value() : null;
		
		// Customer is required, don't call if empty
		if (!customer_val) {
			$('#table-data').html(`
				<tr>
					<td colspan="5" style="text-align:center;">Please select a customer</td>
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
				brand: brand_val
			},
			callback:function(res){
				let data = res.message;
				let table_html = "";
				if(data && data.length > 0){
					console.log(data)					
					for(let row of data){
						const checked = row['checked'] == 1 ? 'checked' : '';
						table_html += `
							<tr>
								<td style="text-align:center;"><input class="checkbox" type="checkbox" ${checked}></td>
								<td style="text-align:center;class="item_code">${row.name}</td>
								<td style="text-align:center;">${row.item_name}</td>
								<td style="text-align:center;">${row.item_group}</td>
								<td style="text-align:center;">${row.brand || ""}</td>
							</tr>
						`
					}
				}
				else{
					table_html += `
						<tr>
							<td colspan="5" style="text-align:center;">No Data Found</td>
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
		if (CheckedItems.length > 0){
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
	}
	let save_button = page.set_primary_action('Save', ()=>update_items())
}