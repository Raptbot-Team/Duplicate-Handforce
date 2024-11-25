import { LightningElement, track } from 'lwc';
import createMatchingRule from '@salesforce/apex/MatchingRuleController.createMatchingRule';

export default class CreateMatchingRule extends LightningElement {

    @track ruleName = ''; // Name of the Matching Rule
    @track selectedObject = ''; // Selected SObject API Name
    @track selectedObjectLabel = ''; // Selected SObject Label
    @track showChildComponent = false; // Control visibility of the child component
    @track matchingRuleId = ''; // ID of the created Matching Rule record

    objectOptions = [
        { label: 'Account', value: 'Account' },
        { label: 'Contact', value: 'Contact' },
        { label: 'Lead', value: 'Lead' },
    ];

    // Handle input changes
    handleRuleNameChange(event) {
        this.ruleName = event.target.value;

    }

    handleObjectChange(event) {
        const selectedOption = this.objectOptions.find(
            (option) => option.value === event.detail.value
        );
        this.selectedObject = selectedOption.value;
        this.selectedObjectLabel = selectedOption.label;
    }

    // Handle Save and Next button click
    handleSaveAndNext() {
        if (!this.ruleName || !this.selectedObject) {
            alert('Please provide both Matching Rule Name and SObject!');
            return;
        }

        // Call Apex to create the Matching Rule record
        createMatchingRule({ ruleName: this.ruleName, objectApiName: this.selectedObject })
            .then((ruleId) => {
                this.matchingRuleId = ruleId; // Store the created record ID
                this.showChildComponent = true; // Show the child component
            })
            .catch((error) => {
                console.error('Error creating Matching Rule:', error);
                alert('Failed to create Matching Rule. Please try again.');
            });
    }

    // close Create Matching Field screen
    previousHandler() {
        this.showChildComponent = false;
        this.ruleName = '';
        this.selectedObject = '';
    }

}