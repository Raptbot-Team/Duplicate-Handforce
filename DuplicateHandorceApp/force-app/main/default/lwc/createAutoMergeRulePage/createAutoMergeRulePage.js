import { LightningElement, track, wire, api } from 'lwc';
import { createRecord } from 'lightning/uiRecordApi';
import getPicklistOptions from '@salesforce/apex/MatchingRuleController.getPicklistOptions';
import getobjectFields from '@salesforce/apex/MatchingRuleController.getObjectFields';
import getStrategyPicklistFieldFromOveriddenFieldObject from '@salesforce/apex/MatchingRuleController.getStrategyPicklistOptionsFromOveriddedFieldObject';
export default class createAutoMergeRulePage extends LightningElement {
  @api objectApiName;
  @api matchingRulerecordId;
  @track masterRecordStrategyOptions = [];
  @track fallbackStrategyOptions = [];
  @track fieldValueRuleOptions = [];
  @track selectedMasterRecordStrategy;
  @track selectedFallbackStrategy;
  @track selectedFieldValueRule;
  @track selectedOverriddenFieldValue;
  @track selectedOverriddenStrategyValue;
  @track strategyOptions = [];
  @track fieldOptions = [];
  @track fields = [];


  connectedCallback() {
    this.objectApiName = 'Account';
    this.loadFieldMetadata(this.objectApiName);
    this.getStrategyPicklist();
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

  getStrategyPicklist() {
    getStrategyPicklistFieldFromOveriddenFieldObject()
      .then((data) => {
        console.log('4848  Data::' + JSON.stringify(data));
        this.strategyOptions = data
          .map(option => ({ label: option.label, value: option.value }))
          .sort((a, b) => a.label.localeCompare(b.label));
      })
      .catch((error) => {
        console.error('Error fetching field metadata:', error);
      });
  }



  loadFieldMetadata(objectApiName) {
    getobjectFields({ objectName: objectApiName })
      .then((data) => {
        console.log('Data::' + JSON.stringify(data));
        this.fieldOptions = Object.entries(data)
          .map(([key, value]) => ({
            label: value,
            value: key
          }))
          .sort((a, b) => a.label.localeCompare(b.label));
      })
      .catch((error) => {
        console.error('Error fetching field metadata:', error);
      });
  }

  // Handle changes in comboboxes
  handleMasterRecordStrategyChange(event) {
    console.log('selectedMasterRecordStrategy==>> ' + event.target.value);
    this.selectedMasterRecordStrategy = event.target.value;
  }

  handleFallbackStrategyChange(event) {
    console.log('selectedFallbackStrategy==>> ' + event.target.value);
    this.selectedFallbackStrategy = event.target.value;
  }

  handlefieldValueRuleChange(event) {
    console.log('selectedFieldValueRule==>> ' + event.target.value);
    this.selectedFieldValueRule = event.target.value;
  }

  handleOverriddenFieldChange(event) {
    console.log('selectedOverriddenFieldValue==>> ' + event.target.value);
    this.selectedOverriddenFieldValue = event.target.value;
  }

  handleOverriddenStrategiesChange(event) {
    console.log('selectedOverriddenStrategyValue==>> ' + event.target.value);
    this.selectedOverriddenStrategyValue = event.target.value;
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
    this.fields.splice(index, 1); // Remove the field at the specific index
    this.fields = [...this.fields];
  }

  handleSave() {
    console.log('==HandleSave==');
    this.matchingRulerecordId = 'a0fJ3000000y9VQIAY';
    const fields = {
      Master_Record_Selection_Rule__c: this.selectedMasterRecordStrategy,
      Matching_Rules__c: this.matchingRulerecordId,
      Fallback_Strategy__c: this.fallbackStrategyOptions,
      Field_Value_Rule__c: this.selectedFieldValueRule
    };
    console.log('fields' + JSON.stringify(fields));
    const recordInput = { apiName: 'Record_Merge_Rule__c', fields };
    createRecord(recordInput)
      .then((recordMergeRule) => {
        console.log('recordMergeRule' + JSON.stringify(recordMergeRule));
      })
      .catch((error) => {
        console.error('Error creating record:', error);
      });
  }
}