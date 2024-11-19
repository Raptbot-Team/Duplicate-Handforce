import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import createMatchingFilter from '@salesforce/apex/MatchingRuleController.createMatchingFilter';
import fetchFieldMetadata from '@salesforce/apex/MatchingRuleController.fetchFieldMetadata';

export default class CreateMatchingFilter extends LightningElement {
  @api matchingRuleId; // Matching Rule record ID passed from parent
  @api objectlabel; // Object Label passed from parent
  @api objectapiname
  @api fieldOptions = []; // Options for the Field picklist
  @track fieldLabel;
  @track fields = []; // Dynamic fields for field mapping
  @track filterValues = [];
  @track fieldDataTypes = [];
  @track operators = [
    { label: 'Empty', value: 'Empty' },
    { label: 'Equals', value: 'Equals' },
    { label: 'Greater Than', value: 'Greater Than' },
    { label: 'Greater Than Or Equal To', value: 'Greater Than Or Equal To' },
    { label: 'Less Than', value: 'Less Than' },
    { label: 'Less Than Or Equal To', value: 'Less Than Or Equal To' },
    { label: 'Not Equal To', value: 'Not Equal To' },
  ];

  connectedCallback() {
    this.operators.sort((a, b) => {
      if (a.label < b.label) return -1;
      if (a.label > b.label) return 1;
      return 0;
    });
    this.fieldLabel = this.objectlabel + ' Field';
    console.log('this.objectapiname==>> ' + this.objectapiname);
    this.loadFieldMetadata(this.objectapiname);
  }

  loadFieldMetadata(objectApiName) {
    fetchFieldMetadata({ objectApiName })
      .then((data) => {
        // Convert the Apex map into a JavaScript Map
        this.fieldDataTypes = new Map(Object.entries(data));
        console.log('fieldDataTypes Map:', this.fieldDataTypes);
      })
      .catch((error) => {
        console.error('Error fetching field metadata:', error);
      });
  }


  // Add new field logic
  addNewFilter() {
    const newField = {
      id: Date.now(), // Unique ID for the new field
      fieldvalue: this.fieldOptions.length > 0 ? this.fieldOptions[0].value : '', // Default field value
      OperatorType: this.operators.length > 0 ? this.operators[0].value : '', // Default Opertor type
      filterValue: this.filterValues.length > 0 ? this.filterValues[0].value : '', // Default Filter value
      fieldDT: this.fieldDataTypes.length > 0 ? this.fieldDataTypes[0].value : 'text', // Default Filter value
    };

    this.fields = [...this.fields, newField]; // Add the new field to the array
  }

  // Handle change in field selection
  handleFieldChange(event) {
    const fieldId = event.target.dataset.id;
    const fieldValue = event.target.value;
    const fieldIndex = this.fields.findIndex(field => field.id == fieldId);
    if (fieldIndex > -1) {
      this.fields[fieldIndex].fieldvalue = fieldValue;
      console.log('fieldValue==>> ' + fieldValue);
      console.log('type of in js ' + typeof this.fieldDataTypes.get(fieldValue));
      console.log('this.fieldDataTypes[fieldValue]==>> ' + this.fieldDataTypes.get(fieldValue));
      var fieldDT = this.fieldDataTypes.get(fieldValue);
      console.log('fieldDT==>> ' + fieldDT);
      console.log('this.updateInputFieldDataType(fieldIndex, this.fieldDataTypes.get(fieldValue))    ==>> ' + this.updateInputFieldDataType(fieldDT));
      this.fields[fieldIndex].fieldDT = this.updateInputFieldDataType(fieldDT);
      this.fields = [...this.fields];
      console.log('this.fields==>>  ' + JSON.stringify(this.fields));
    }
  }

  // Handle change in operator selection
  handleOperatorChange(event) {
    const fieldId = event.target.dataset.id;
    const matchingTypeValue = event.target.value;
    const fieldIndex = this.fields.findIndex(field => field.id == fieldId);
    if (fieldIndex > -1) {
      this.fields[fieldIndex].OperatorType = matchingTypeValue;
    }

  }

  // Handle change in value selection
  handleFilterValueChange(event) {
    const fieldId = event.target.dataset.id;
    var matchingTypeValue;
    if (event.target.type == 'checkbox') {
      console.log('event.target.checkbox==>> ' + event.target.checked);
      if (event.target.checked) {
        matchingTypeValue = "true";
      } else {
        matchingTypeValue = "false";
      }
    } else {
      matchingTypeValue = event.target.value;
    }
    const fieldIndex = this.fields.findIndex(field => field.id == fieldId);
    if (fieldIndex > -1) {
      this.fields[fieldIndex].filterValue = matchingTypeValue;
    }

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

  // Handle previous action
  previousHandler() {
    console.log('go previous');
    this.dispatchEvent(new CustomEvent("goprevious"));
  }

  // go matching rule screen
  hanldeGofirstscreen() {
    console.log('go previous');
    this.dispatchEvent(new CustomEvent("gofirstscreen"));
  }

  handleSave() {

    console.log('this.matchingRuleId    ==>> ' + this.matchingRuleId);
    // Prepare records for saving
    const recordsToSave = this.fields.map(field => ({
      Field_Api_Name__c: field.fieldvalue,
      Matching_Rules__c: this.matchingRuleId, // Related Matching Rule
      Operator__c: field.OperatorType,
      Value__c: field.filterValue
    }));

    console.log('==IN CreateMatchingFilter=Same==>>  ' + JSON.stringify(recordsToSave));

    // Call Apex to save records
    createMatchingFilter({ matchingFilterRecords: recordsToSave })
      .then(() => {
        this.showToastMessage('Success', 'Matching Filter Records created successfully!', 'success');
        this.fields = []; // Clear fields
      })
      .catch(error => {
        console.error('Error saving records:', error);
        this.showToastMessage('Error', error.body.message, 'error');
      });

    this.hanldeGofirstscreen();

  }

  updateInputFieldDataType(fieldDT) {
    var inputType = '';
    console.log('fieldDT   ' + fieldDT);

    if (
      fieldDT == 'URL' ||
      fieldDT == 'EMAIL' ||
      fieldDT == 'PHONE' ||
      fieldDT == 'TEXTAREA' ||
      fieldDT == 'STRING' ||
      fieldDT == 'PICKLIST' ||
      fieldDT == 'REFERENCE'
    ) {
      console.log('hiiiiiii');
      inputType = 'text';
      console.log('hiiiiiii22222222222');
    } else if (fieldDT == 'DATE') {
      inputType = 'date';
    } else if (fieldDT == 'DATETIME') {
      inputType = 'datetime';
    } else if (
      fieldDT == 'INTEGER' ||
      fieldDT == 'DOUBLE' ||
      fieldDT == 'CURRENCY'
    ) {
      inputType = 'number';
    } else if (fieldDT == 'BOOLEAN') {
      inputType = 'checkbox';
    } else {
      inputType = 'text'; // Fallback type
    }
    console.log('inputType   ' + inputType);

    return inputType;

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