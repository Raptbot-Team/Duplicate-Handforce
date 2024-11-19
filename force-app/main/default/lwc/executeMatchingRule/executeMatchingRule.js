import { LightningElement, wire, api } from "lwc";
import { CurrentPageReference } from "lightning/navigation";
import getRecordDetails from "@salesforce/apex/ExecuteMatchingRuleController.getRecordDetails";

export default class ExecuteMatchingRule extends LightningElement {
  @api recordId;
  @api recordDetails;
  @api columns = [];
  fieldNames;
  duplicateRecPair;
  duplicateRecFound;

  @wire(getRecordDetails, { recId: "$recordId" })
  wiredRecord({ data, error }) {
    if (data) {
      this.recordDetails = Object.values(data["duplicateRecords"]);
      console.log(
        "this.reordDetails ====" + JSON.stringify(this.recordDetails)
      );
      this.duplicateRecPair = Object.keys(data["duplicateRecords"]).length;
      this.fieldNames = data["fieldNames"];
      console.log("this.fieldNames === " + JSON.stringify(this.fieldNames));

      if (this.duplicateRecPair > 0) {
        this.duplicateRecFound = true;
      } else {
        this.duplicateRecFound = false;
      }
      // Dynamically creating columns based on field names
      this.columns = this.fieldNames.map((fieldName) => ({
        label: fieldName.replace(/__c/g, "").replace(/_/g, " "),
        fieldName: fieldName
      }));

      console.log("this.columns === " + JSON.stringify(this.columns));
    } else {
      console.log("error -- " + JSON.stringify(error));
    }
  }
}