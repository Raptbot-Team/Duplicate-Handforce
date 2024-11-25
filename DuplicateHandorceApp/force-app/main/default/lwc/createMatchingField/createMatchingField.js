import { LightningElement, api, track } from 'lwc';
import getObjectFields from '@salesforce/apex/MatchingRuleController.getFieldsForObject';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import createMatchingFields from '@salesforce/apex/MatchingRuleController.createMatchingFields';

export default class CreateMatchingField extends LightningElement {
    @api ruleId; // Matching Rule record ID passed from parent
    @api objectApiName; // Object API Name passed from parent
    @api objectLabel; // Object Label passed from parent
    @api ruleName; // Rule Name passed from parent
    @track showChildMatchingFilterComponent = false;
    @track fieldLabel;
    @track fields = []; // Dynamic fields for field mapping
    @track fieldOptions = []; // Options for the Field picklist
    @track matchingTypeOptions = [
        { label: 'Exact Match', value: 'Exact Match' },
        { label: 'Fuzzy Match', value: 'Fuzzy Match' },
        { label: 'Partial Match', value: 'Partial Match' },
        { label: 'Phonetic Match', value: 'Phonetic Match' },
    ];

    connectedCallback() {
        this.fieldLabel = this.objectApiName + ' ' + 'Field';
        console.log('23this==>> ' + this.fieldLabel);
        this.loadObjectFields();
        this.fields = this.fields.map((field, index) => ({
            ...field,
            index: index + 1, // Add index to each field
        }));

        console.log('this.fields==>> ' + JSON.stringify(this.fields));

    }

    // Fetch fields for the selected object
    loadObjectFields() {
        getObjectFields({ objectApiName: this.objectApiName })
            .then((fields) => {
                this.fieldOptions = fields.map((field) => ({
                    label: `${field.label}`,
                    value: field.apiName,
                }));
                this.fieldOptions.sort((a, b) => {
                    if (a.label < b.label) return -1;
                    if (a.label > b.label) return 1;
                    return 0;
                });
            })
            .catch((error) => {
                console.error('Error fetching fields:', error);
            });
    }

    // Add new field logic
    addNewField() {
        const newField = {
            id: Date.now(), // Unique ID for the new field
            value: this.fieldOptions.length > 0 ? this.fieldOptions[0].value : '', // Default field value
            matchingType: this.matchingTypeOptions.length > 0 ? this.matchingTypeOptions[0].value : '', // Default matching type
        };

        this.fields = [...this.fields, newField]; // Add the new field to the array
        console.log('this.fields==>> ' + JSON.stringify(this.fields));


    }

    // Handle change in field selection
    handleFieldChange(event) {
        const fieldId = event.target.dataset.id;
        const fieldValue = event.target.value;
        this.fields.forEach(element => {
            if (element.id == fieldId) {
                element.value = fieldValue;
            }
        });
    }

    // Handle change in matching type selection
    handleMatchingTypeChange(event) {
        const fieldId = event.target.dataset.id;
        const matchingTypeValue = event.target.value;
        this.fields.forEach(element => {
            if (element.id == fieldId) {
                element.matchingType = matchingTypeValue;
            }
        });

    }

    // Handle delete field action
    handleDeleteField(event) {
        const id = parseInt(event.target.dataset.id, 10); // Getting the index from the button's id
        const index = this.fields.findIndex(field => field.id == id);
        this.fields.splice(index, 1); // Remove the field at the specific index
        this.fields = [...this.fields];
    }

    // Handle previous action
    previousHandler() {
        this.dispatchEvent(new CustomEvent("previous"));
    }

    handlegofirstscreen() {
        this.previousHandler();
    }

    handleGoPrevious() {
        this.showChildMatchingFilterComponent = false;
    }


    handleSaveAndNext() {
        // Prepare records for saving
        const recordsToSave = this.fields.map(field => ({
            Matching_Rules__c: this.ruleId, // Related Matching Rule
            Field_Api_Name__c: field.value,
            Matching_Type__c: field.matchingType
        }));

        console.log('===Same==>>  ' + JSON.stringify(recordsToSave));

        // Call Apex to save records
        createMatchingFields({ matchingFieldRecords: recordsToSave })
            .then(() => {
                this.showToastMessage('Success', 'Matching Field Records created successfully!', 'success');
                this.showChildMatchingFilterComponent = true;
                console.log('=fieldOptions==>>' + this.fieldOptions);
                //this.fields = []; // Clear fields
            })
            .catch(error => {
                console.error('Error saving records:', error);
                this.showToastMessage('Error', error.body.message, 'error');
            });

    }

    showToastMessage(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: variant
            })
        );
    }

}