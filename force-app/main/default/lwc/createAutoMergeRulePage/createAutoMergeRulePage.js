import { LightningElement, track, wire } from 'lwc';
import getPicklistOptions from '@salesforce/apex/MatchingRuleController.getPicklistOptions';

export default class createAutoMergeRulePage extends LightningElement {
  @track masterRecordStrategyOptions = [];
  @track fallbackStrategyOptions = [];
  @track fieldValueRuleOptions = [];
  @track selectedMasterRecordStrategy;
  @track selectedFallbackStrategy;
  @track selectedFieldValueRule;

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

    } else if (error) {
      console.error('Error fetching picklist options:', error);
    }
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
}