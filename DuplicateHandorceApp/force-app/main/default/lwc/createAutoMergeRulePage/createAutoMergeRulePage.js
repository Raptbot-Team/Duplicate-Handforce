import { LightningElement, track, wire, api } from 'lwc';
import getPicklistOptions from '@salesforce/apex/MatchingRuleController.getPicklistOptions';
import getobjectFields from '@salesforce/apex/MatchingRuleController.getObjectFields';

export default class createAutoMergeRulePage extends LightningElement {
  @api objectApiName;
  @track masterRecordStrategyOptions = [];
  @track fallbackStrategyOptions = [];
  @track fieldValueRuleOptions = [];
  @track selectedMasterRecordStrategy;
  @track selectedFallbackStrategy;
  @track selectedFieldValueRule;
  @track strategyOptions = [];
  @track fieldOptions = [];
  @track fields = [];


  connectedCallback() {
    this.objectApiName = 'Account';
    this.loadFieldMetadata(this.objectApiName);
  }

  // Fetch picklist options
  @wire(getPicklistOptions)
  wiredOptions({ error, data }) {
    if (data) {

      this.masterRecordStrategyOptions = data.masterRecordStrategy
        .map(option => ({ label: option.label, value: option.value }))
        .sort((a, b) => a.label.localeCompare(b.label));

      this.fallbackStrategyOptions = data.fallbackStrategy
        .map(option => ({ label: option.label, value: option.value }))
        .sort((a, b) => a.label.localeCompare(b.label));

      this.fieldValueRuleOptions = data.fieldValueRule
        .map(option => ({ label: option.label, value: option.value }))
        .sort((a, b) => a.label.localeCompare(b.label));
      console.log('fieldValueRuleOptions Map:', JSON.stringify(this.fieldValueRuleOptions));
    } else if (error) {
      console.error('Error fetching picklist options:', error);
    }
  }

  loadFieldMetadata(objectApiName) {
    getobjectFields({ objectApiName })
      .then((data) => {
        this.fieldOptions = Object.entries(data)
          .map(([key, value]) => ({
            label: key,
            value: value
          }))
          .sort((a, b) => a.label.localeCompare(b.label));
      })
      .catch((error) => {
        console.error('Error fetching field metadata:', error);
      });
  }

  // Handle changes in comboboxes
  handleMasterRecordStrategyChange(event) {
    this.selectedMasterRecordStrategy = event.target.value;
  }

  handleFallbackStrategyChange(event) {
    this.selectedFallbackStrategy = event.target.value;
  }

  handlefieldValueRuleChange(event) {
    this.selectedFieldValueRule = event.target.value;
  }

  handleFieldChange(event) {
    //this.selectedFieldValueRule = event.target.value;
  }

  handleOperatorChange(event) {
    //this.selectedOperator = event.target.value;
  }


  addNewOverrideField() {
    console.log('hiiiii');
    const newField = {
      id: Date.now(), // Unique ID for the new field
      fieldOption: this.fieldOptions.length > 0 ? this.fieldOptions[0].value : '', // Default field value
      strategyType: this.strategyOptions.length > 0 ? this.strategyOptions[0].value : '', // Default Opertor type
    };

    this.fields = [...this.fields, newField]; // Add the new field to the array
  }

  // Handle delete field action
  handleDeleteField(event) {
    const id = parseInt(event.target.dataset.id, 10); // Getting the index from the button's id
    const index = this.fields.findIndex(field => field.id == id);
    console.log('index==>>' + index);
    this.fields.splice(index, 1); // Remove the field at the specific index
    this.fields = [...this.fields];
    console.log('this.fields==>> ' + JSON.stringify(this.fields));
  }
}