public with sharing class MatchingRuleController {


    @AuraEnabled
    public static List<Map<String, String>> getStrategyPicklistOptionsFromOveriddedFieldObject() {

        List<Map<String, String>> masterRecordStrategyOptions = new List<Map<String, String>>();
        // Get picklist values
        Schema.DescribeFieldResult field1Describe = Overridden_Field_Value_Strategy__c.Strategy__c.getDescribe();
        List<Schema.PicklistEntry> field1PicklistValues = field1Describe.getPicklistValues();
        for (Schema.PicklistEntry entry : field1PicklistValues) {
            masterRecordStrategyOptions.add(new Map<String, String>{
                'label' => entry.getLabel(),
                'value' => entry.getValue()
            });
            
        }
        return masterRecordStrategyOptions;
    }

    @AuraEnabled(cacheable=true)
    public static Map<String, List<Map<String, String>>> getPicklistOptions() {
        Map<String, List<Map<String, String>>> optionsMap = new Map<String, List<Map<String, String>>>();

        // Get picklist values for the Master record selection field
        Schema.DescribeFieldResult field1Describe = Record_Merge_Rule__c.Master_Record_Selection_Rule__c.getDescribe();
        List<Schema.PicklistEntry> field1PicklistValues = field1Describe.getPicklistValues();
        List<Map<String, String>> masterRecordStrategyOptions = new List<Map<String, String>>();
        for (Schema.PicklistEntry entry : field1PicklistValues) {
            masterRecordStrategyOptions.add(new Map<String, String>{
                'label' => entry.getLabel(),
                'value' => entry.getValue()
            });
        }
        optionsMap.put('masterRecordStrategy', masterRecordStrategyOptions);

        // Get picklist values for the Fallback Strategy field
        Schema.DescribeFieldResult field2Describe = Record_Merge_Rule__c.Fallback_Strategy__c.getDescribe();
        List<Schema.PicklistEntry> field2PicklistValues = field2Describe.getPicklistValues();
        List<Map<String, String>> fallbackStrategyOptions = new List<Map<String, String>>();
        for (Schema.PicklistEntry entry : field2PicklistValues) {
            fallbackStrategyOptions.add(new Map<String, String>{
                'label' => entry.getLabel(),
                'value' => entry.getValue()
            });
        }
        optionsMap.put('fallbackStrategy', fallbackStrategyOptions);

        // Get picklist values for the Field Value field
        Schema.DescribeFieldResult field3Describe = Record_Merge_Rule__c.Field_Value_Rule__c.getDescribe();
        List<Schema.PicklistEntry> field3PicklistValues = field3Describe.getPicklistValues();
        List<Map<String, String>> fieldValueRuleOptions = new List<Map<String, String>>();
        for (Schema.PicklistEntry entry : field3PicklistValues) {
            fieldValueRuleOptions.add(new Map<String, String>{
                'label' => entry.getLabel(),
                'value' => entry.getValue()
            });
        }
        optionsMap.put('fieldValueRule', fieldValueRuleOptions);

        return optionsMap;
    }

    @AuraEnabled
    public static Map<String, String> getObjectFields(String objectName) {
        Map<String, String> fieldMap = new Map<String, String>();
        system.debug('objectName:: ==>> '+objectName);
        try {
            // Get object description
            Schema.DescribeSObjectResult describeResult = Schema.getGlobalDescribe().get(objectName).getDescribe();
            Map<String, Schema.SObjectField> fields = describeResult.fields.getMap();
            system.debug('Fields:: ==>> '+fields);
            // Iterate over fields and populate the map
            for (String fieldName : fields.keySet()) {
                Schema.DescribeFieldResult fieldDescribe = fields.get(fieldName).getDescribe();
                fieldMap.put(fieldDescribe.getName(), fieldDescribe.getLabel());
            }
            system.debug('fieldMap:: ==>> '+fieldMap);
        } catch (Exception e) {
            throw new AuraHandledException('Error retrieving fields for ' + objectName + ': ' + e.getMessage());
        }
        return fieldMap;
    }


    @AuraEnabled(cacheable=true)
    public static Map<String, String> fetchFieldMetadata(String objectApiName) {
    Map<String, String> fieldMetadata = new Map<String, String>();

    // Get field metadata for the specified  object 
    Map<String, Schema.SObjectField> fields = Schema.getGlobalDescribe().get(objectApiName).getDescribe().fields.getMap();

    for (String fieldName : fields.keySet()) {
        fieldMetadata.put(fieldName, fields.get(fieldName).getDescribe().getType().name());
    }
    system.debug(fieldMetadata);
    system.debug(fieldMetadata);
    return fieldMetadata;
}

    @AuraEnabled
    public static void createMatchingFields(List<Matching_Field__c> matchingFieldRecords) {
        if (matchingFieldRecords != null && !matchingFieldRecords.isEmpty()) {
            insert matchingFieldRecords;
        } else {
            throw new AuraHandledException('No Matching Field Record to save.');
        }
    }

    @AuraEnabled
    public static void createMatchingFilter(List<Matching_Filter__c> matchingFilterRecords) {
        if (matchingFilterRecords != null && !matchingFilterRecords.isEmpty()) {
            insert matchingFilterRecords;
        } else {
            throw new AuraHandledException('No Matching Filter Record to save.');
        }
    }

    
    @AuraEnabled
    public static Id createMatchingRule(String ruleName, String objectApiName) {
        Matching_Rule__c matchingRule = new Matching_Rule__c();
        matchingRule.Name = ruleName;
        matchingRule.SObject__c = objectApiName;

        insert matchingRule;

        return matchingRule.Id;
    }

    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getFieldsForObject(String objectApiName) {
        List<Map<String, String>> fieldsList = new List<Map<String, String>>();
        Schema.DescribeSObjectResult describeResult = Schema.getGlobalDescribe()
            .get(objectApiName)
            .getDescribe();
        Map<String, Schema.SObjectField> fields = describeResult.fields.getMap();

        for (String fieldName : fields.keySet()) {
            Schema.DescribeFieldResult fieldDescribe = fields.get(fieldName).getDescribe();
            if (fieldDescribe.isAccessible()) {
                fieldsList.add(new Map<String, String>{
                    'label' => fieldDescribe.getLabel(),
                    'dataType' => fieldDescribe.getType().name(),
                    'apiName' => fieldName
                });
            }
        }

        return fieldsList;
    }
}