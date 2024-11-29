import { LightningElement, wire, api, track } from "lwc";
import getRecordDetails from "@salesforce/apex/ExecuteMatchingRuleController.getRecordDetails";

export default class ExecuteMatchingRule extends LightningElement {
  @track masterRecordIds;
  @api recordId;
  @track columns = [];
  @track masterColumns = [];
  @track preparedRecordDetails = [];
  duplicateRecPair;
  duplicateRecFound;
  @track toggleIconName = 'utility:chevronright';
  isShowModal = false
  @track fieldValuesWithLabelAndValues = [];
  @track headerList;
  fieldNameWithAPI;
  @track tesVar = [{ label: "1", value: [1, 2, 3] }, { label: "2", value: [1, 2, 3] }];
  inputBoxValue = 'test Value';
  headerLabel = "Contact";

  renderedCallback() {
    if (this.isShowModal) {
      const firstColumnRadioButtons = this.template.querySelectorAll(`lightning-input[data-id="0"]`);
      firstColumnRadioButtons.forEach(radio => {
        radio.checked = true;
        if (radio.name !== 'headerRadioButton') {
          this.updateInputBoxValue(radio);
        } else {
          radio.label = "Master " + this.headerLabel;
        }
      });
    }
  }

  @wire(getRecordDetails, { recId: "$recordId" })
  wiredRecord({ data, error }) {
    if (data) {
      let recordDetails = Object.values(data["duplicateRecords"]);
      let duplicateColumns = data["fieldNames"];
      this.duplicateRecPair = Object.keys(data["duplicateRecords"]).length;
      // let mapofFieldValues = data["mapOfFieldValues"];
      this.fieldNameWithAPI = data["fieldNameWithAPI"];

      // Condtional to check if records are found or not
      if (this.duplicateRecPair > 0) {
        this.duplicateRecFound = true;

        // call the masterChildRecordSeparator method to prepare the data
        this.masterChildRecordSeparator(recordDetails);

        //call the prepareColumns method to prepare the columns
        this.prepareColumns(duplicateColumns);
        // this.convertMapOfFieldValuesIntoLabelAndValue(mapofFieldValues)
      } else {
        this.duplicateRecFound = false;
      }
    } else {
      console.log("error -- " + JSON.stringify(error));
    }
  }

  // method to separate master and child records
  masterChildRecordSeparator(listOfDuplicateRecords) {
    this.preparedRecordDetails = listOfDuplicateRecords.map((group) => {
      return {
        master: [
          {
            ...group[0],
            toggleIconName: 'utility:chevronright',
          },
        ],
        children: group.slice(1),
      };
    });
  }
  // method to remove extra underscores and replace with spaces and create a map of columns with label and api name
  prepareColumns(duplicateColumns) {
    this.columns = duplicateColumns.map((fieldName) => ({
      label: this.fieldNameWithAPI[fieldName],
      fieldName: fieldName,
    }));

    this.columns.push({
      label: 'Action',
      type: 'button',
      initialWidth: 150,
      typeAttributes: {
        label: 'Merge Preview',
        name: 'mergePreview',
        variant: 'base',
        alignment: 'center',
      },
    });

    this.masterColumns = [
      {
        label: '',
        type: 'button-icon',
        initialWidth: 25,
        typeAttributes: {
          iconName: { fieldName: 'toggleIconName' },
          alternativeText: 'Toggle child records',
          variant: 'bare',
          name: 'toggle',
        },
      },
      ...this.columns,
    ];


    this.columns = [{ label: '', type: 'text', initialWidth: 25 }, ...this.columns];
  }

  // handler method to show the Modal/Popup on the UI on clicking the toggle button
  handleRowAction(event) {
    const actionName = event.detail.action.name;
    const row = event.detail.row;
    this.masterRecordId = row.Id;
    const groupIndex = this.preparedRecordDetails.findIndex((group) =>
      group.master.some((record) => record.Id === row.Id)
    );
    if (actionName === 'toggle') {
      if (groupIndex !== -1) {
        const childRecordsDiv = this.template.querySelector(
          `.child-records[data-index="${groupIndex}"]`
        );

        if (childRecordsDiv.style.display === "none") {
          childRecordsDiv.style.display = "block";
          row.toggleIconName = 'utility:chevrondown';
        } else {
          childRecordsDiv.style.display = "none";
          row.toggleIconName = 'utility:chevronright';
        }
        this.preparedRecordDetails[groupIndex].master = this.preparedRecordDetails[groupIndex].master.map((record) => {
          if (record.Id === row.Id) {
            return { ...record, toggleIconName: row.toggleIconName };
          }
          return record;
        });

        this.preparedRecordDetails = [...this.preparedRecordDetails];
      }
    } else if (actionName === 'mergePreview') {
      const mergableRecords = this.preparedRecordDetails[groupIndex].master.concat(this.preparedRecordDetails[groupIndex].children);
      this.getFieldWiseListOfValues(mergableRecords, this.fieldNameWithAPI);
      this.isShowModal = true;
    }
  }

  // handler method to close the Modal/Popup on the UI
  handleCloseButton(event) {
    this.isShowModal = false;
  }

  handleRadioButtonOnHeader(event) {
    const dataId = event.target.dataset.id;
    const allRadioButtons = this.template.querySelectorAll(`lightning-input[data-id="${dataId}"]`);
    console.log('allRadioButtons.length === ' + allRadioButtons.length);

    // Check all radio buttons for this column
    allRadioButtons.forEach((radio) => {
      radio.checked = true;

      // call the updateInputBoxValue mathod to update for the corresponding input box
      this.updateInputBoxValue(radio);
    });

    // Update header radio button label
    const headerRadioButton = this.template.querySelectorAll(`lightning-input[data-index="header"]`);
    headerRadioButton.forEach((radio) => {
      radio.label = this.headerLabel;
    });
    event.target.label = "Master " + this.headerLabel;
  }

  handleRadioButtonOnField(event) {
    const selectedRadio = event.target;
    // Call updateInputBoxValue method to update the corresponding input box when a radio button is selected
    this.updateInputBoxValue(selectedRadio);
  }

  updateInputBoxValue(radio) {
    const rowIndex = radio.dataset.index;
    const valueCell = radio.value;

    if (valueCell) {
      const value = valueCell;
      const inputBox = this.template.querySelector(`tr[data-index="${rowIndex}"] lightning-input[data-index="${rowIndex}"]`);

      if (inputBox) {
        inputBox.value = value;
      }
    }
  }

  // Method takes the recors which are to be shown on the modal and the fieldApiName, convert them into map of fieldName and list of its values.
  getFieldWiseListOfValues(recordsToShowOnModal, fieldsNameWithAPI) {
    const fieldWiseValues = [];
    for (const [apiName, label] of Object.entries(fieldsNameWithAPI)) {
      const values = [];
      recordsToShowOnModal.forEach(record => {
        const recordValue = record[apiName];
        if (recordValue !== undefined && recordValue !== null) {
          if (recordValue === true) {
            values.push("true")
          } else if (recordValue === false) {
            values.push("false")
          } else {
            values.push(recordValue);
          }
        }
        else if (recordValue === undefined || recordValue === null) {
          values.push(" ");
        }
      });

      fieldWiseValues.push({
        label: label,
        value: values,
      });
    }
    this.fieldValuesWithLabelAndValues = fieldWiseValues;
    this.headerList = this.fieldValuesWithLabelAndValues[0];

  }

}
