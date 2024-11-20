import { LightningElement, wire, api, track } from "lwc";
import getRecordDetails from "@salesforce/apex/ExecuteMatchingRuleController.getRecordDetails";

export default class ExecuteMatchingRule extends LightningElement {
  @api recordId;
  @track recordDetails;
  @track columns = [];
  @track masterColumns = [];
  @track preparedRecordDetails = [];
  duplicateRecPair;
  duplicateRecFound;
  @track ToggleIconName = 'utility:chevronright';


  @wire(getRecordDetails, { recId: "$recordId" })
  wiredRecord({ data, error }) {
    if (data) {
      this.recordDetails = Object.values(data["duplicateRecords"]);
      this.duplicateRecPair = Object.keys(data["duplicateRecords"]).length;

      if (this.duplicateRecPair > 0) {
        this.duplicateRecFound = true;

        // Prepare record details: Separate master and child records
        this.preparedRecordDetails = this.recordDetails.map((group) => {
  return {
    master: [
      {
        ...group[0], // Take only the first record from the group
        ToggleIconName: 'utility:chevronright', // Add initial icon state
      },
    ],
    children: group.slice(1), // Remaining records are children
  };
});


      } else {
        this.duplicateRecFound = false;
      }

      // Dynamically creating columns based on field names
      this.columns = data["fieldNames"].map((fieldName) => ({
        label: fieldName.replace(/__c/g, "").replace(/_/g, " "),
        fieldName: fieldName
      }));

      this.columns.push({
        label: 'Action',
        type: ' button',
        typeAttributes: {
          label: { fieldName: "Name" },
          name: 'show_child',
          variant: 'brand',
        },
      });

      this.masterColumns = [
        {
          label: '',
          type: 'button-icon',
          initialWidth: 25,
          typeAttributes: {
            iconName:{ fieldName: 'ToggleIconName' },
            alternativeText: 'Toggle child records',
            variant: 'bare',
            name: 'toggle',
          },
        },
        ...this.columns,
      ];

      this.columns = [{label: '',type:'text', initialWidth:25},...this.columns]
    } else {
      console.log("error -- " + JSON.stringify(error));
    }
  }

  handleRowAction(event) {
  const actionName = event.detail.action.name;
  const row = event.detail.row;

  if (actionName === 'toggle') {
    // Find the index of the clicked row in preparedRecordDetails
    const groupIndex = this.preparedRecordDetails.findIndex((group) =>
      group.master.some((record) => record.Id === row.Id)
    );

    if (groupIndex !== -1) {
      // Toggle the icon and child record visibility
      const childRecordsDiv = this.template.querySelector(
        `.child-records[data-index="${groupIndex}"]`
      );

      if (childRecordsDiv.style.display === "none") {
        childRecordsDiv.style.display = "block";
        row.ToggleIconName = 'utility:chevrondown';
      } else {
        childRecordsDiv.style.display = "none";
        row.ToggleIconName = 'utility:chevronright';
      }

      // Update the data array to reflect changes
      this.preparedRecordDetails[groupIndex].master = this.preparedRecordDetails[groupIndex].master.map((record) => {
        if (record.Id === row.Id) {
          return { ...record, ToggleIconName: row.ToggleIconName };
        }
        return record;
      });

      // Trigger UI update
      this.preparedRecordDetails = [...this.preparedRecordDetails];
    }
  }
}

}


