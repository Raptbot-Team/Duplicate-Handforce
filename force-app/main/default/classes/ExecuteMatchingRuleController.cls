public with sharing class ExecuteMatchingRuleController {
  public static List<String> filterFieldName = new List<String>();
  public static List<String> duplicatefieldName = new List<String>();
  public static List<Map<String, String>> matchingCombinationList = new List<Map<String, String>>();
  public static Set<String> uniqueFieldNames = new Set<String>();
  @AuraEnabled(cacheable=true)
  public static Map<String, Object> getRecordDetails(Id recId) {
    List<String> fieldsToRegroup = new List<String>();
    //fetch the matching rule of the corresponding record
    List<Matching_Rule__c> matchingDetails = [
      SELECT
        SObject__c,
        (    
          SELECT Field_Api_Name__c, Matching_Type__c
          FROM Matching_Fields__r
        ),
        (
          SELECT Field_Api_Name__c, Operator__c, Value__c
          FROM Matching_Filters__r
        )
      FROM Matching_Rule__c
      WHERE Id = :recId
    ];

    Matching_Rule__c matchingRule = matchingDetails[0];
    String objectType = String.valueOf(matchingRule.SObject__c);

    // Call the convertMatchingFiltersIntoString method to convert the filter into String
    String filterStr = '';
    filterStr = convertMatchingFiltersIntoString(
      matchingRule.Matching_Filters__r
    );
    System.debug('filterStr --- ' + filterStr);

    // call the convertMatchingFieldsIntoString method to convert the filter into String
    String fieldStr = convertMatchingFieldsIntoString(
      matchingRule.Matching_Fields__r,
      objectType
    );
    System.debug('fieldStr --- ' + fieldStr);

    //fetch the duplicate records from the database of the respective object
    String filteredField = '';
    if (fieldStr.length() > 0) {
      fieldsToRegroup.addAll(duplicatefieldName);
      if (filterFieldName.size() > 0) {
        // Create a Set to hold unique values
        uniqueFieldNames = new Set<String>();

        // Add both lists to the Set (duplicates will be removed automatically)
        uniqueFieldNames.addAll(duplicatefieldName);
        uniqueFieldNames.addAll(filterFieldName);

        // Convert the Set back to a List (if you need a List for further processing)
        duplicatefieldName.clear();
        duplicatefieldName.addAll(uniqueFieldNames);
        fieldsToRegroup.addAll(filterFieldName);
        System.debug(
          'duplicatefieldName after assigning set --- ' + duplicatefieldName
        );
        System.debug('uniqueFieldNames-- ' + uniqueFieldNames);
      }
      duplicatefieldName.add(0, 'Id');
      if (!duplicatefieldName.contains('Name')) {
        duplicatefieldName.add(1, 'Name');
      }

      System.debug('duplicatefieldName-- ' + duplicatefieldName);
      String soqlQuery =
        'SELECT ' +
        String.join(duplicatefieldName, ',') +
        ' FROM ' +
        objectType +
        ' WHERE (' +
        fieldStr +
        ')' +
        filterStr +
        ' ORDER BY ' +
        String.join(duplicatefieldName, ',') +
        ' NULLS LAST';
      System.debug('soql query --- ' + soqlQuery);
      List<SObject> matchingRecords = Database.query(soqlQuery);
      System.debug('matching records --- ' + matchingRecords);
      System.debug(
        'matchingCombinationList Today -- ' + matchingCombinationList
      );

      System.debug('fieldsToRegroup --- ' + fieldsToRegroup);
      Map<String, List<SObject>> groupedDuplicateMap = groupDuplicates(
        matchingRecords,
        fieldsToRegroup
      );
      System.debug('groupedDuplicateMap --- ' + groupedDuplicateMap);
      System.debug('dupFields ----- ' + duplicatefieldName);

      return new Map<String, Object>{
        'duplicateRecords' => groupedDuplicateMap,
        'fieldNames' => duplicatefieldName
      };
    }
    return new Map<String, Object>();
  }

  //method to convert matching filter into String to utilize it in dynamic Query
  public static String convertMatchingFiltersIntoString(
    List<Matching_Filter__c> matchingFilters
  ) {
    String filterString = '';
    String operator = '';
    String value = '';
    //convert different operator values into operators to use it in SOQL query
    for (Matching_Filter__c matchingFilter : matchingFilters) {
      if (matchingFilter.Operator__c == 'Empty') {
        operator = '= null';
      } else if (matchingFilter.Operator__c == 'Equals') {
        operator = '=';
      } else if (matchingFilter.Operator__c == 'Greater Than') {
        operator = '>';
      } else if (matchingFilter.Operator__c == 'Greater Than Or Equal To') {
        operator = '>=';
      } else if (matchingFilter.Operator__c == 'Less Than') {
        operator = '<';
      } else if (matchingFilter.Operator__c == 'Less Than Or Equal To') {
        operator = '<=';
      } else if (matchingFilter.Operator__c == 'Not Equal To') {
        operator = '!=';
      }

      if (matchingFilter.Value__c != null) {
        value = matchingFilter.Value__c;
      }
      filterString +=
        ' AND ' +
        matchingFilter.Field_Api_Name__c +
        ' ' +
        operator +
        ' ' +
        '\'' +
        value +
        '\'';
      filterFieldName.add(matchingFilter.Field_Api_Name__c);
    }
    //filterFieldName.removeEnd(',');
    return filterString;
  }

  //method to convert matching fields into String to utilize it in dynamic Query
  public static String convertMatchingFieldsIntoString(
    List<Matching_Field__c> matchingFields,
    String ObjectName
  ) {
    String fieldString = '';
    List<String> fieldName = new List<String>();

    for (Matching_Field__c matchingField : matchingFields) {
      if (matchingField.Field_Api_Name__c != null) {
        fieldName.add(matchingField.Field_Api_Name__c);
      }
    }
    if (fieldName.size() > 0) {
      System.debug('fieldName === ' + fieldName);
      duplicatefieldName = fieldName;
      System.debug('duplicatefieldName at initial == ' + duplicatefieldName);
    }
    List<List<String>> duplicateCombinations = new List<List<String>>();

    String dynamicQueryToFindDuplicateRec =
      'SELECT ' +
      String.join(fieldName, ',') +
      ' FROM ' +
      ObjectName +
      ' GROUP BY ' +
      String.join(fieldName, ',') +
      ' HAVING COUNT(Id) > 1';
    List<AggregateResult> results = Database.query(
      dynamicQueryToFindDuplicateRec
    );
    System.debug('results --- ' + results);
    String conditionString = '';
    if (results.size() > 0) {
      for (AggregateResult ar : results) {
        Map<String, String> matchingCombinationEle = new Map<String, String>();
        conditionString += ' OR (';
        for (Integer i = 0; i < fieldName.size(); i++) {
          String val = '';
          if (ar.get(fieldName[i]) != null) {
            system.debug('ar.get(fieldName[i])-- ' + ar.get(fieldName[i]));
            val += '\'' + ar.get(fieldName[i]) + '\'';
          } else {
            val += ar.get(fieldName[i]);
          }
          conditionString += fieldName[i] + ' = ' + val + ' AND ';
          matchingCombinationEle.put(fieldName[i], val);
        }

        matchingCombinationList.add(matchingCombinationEle);

        System.debug('conditionString In between -- ' + conditionString);
        conditionString = conditionString.removeEnd(' AND ');
        conditionString += ')';
      }
      conditionString = conditionString.removeStart(' OR ');

      System.debug('Condition string -- ' + conditionString);

      return conditionString;
    }
    return conditionString;
  }

  // Method to group duplicate records in list of maps based on duplicate fields
  public static Map<String, List<SObject>> groupDuplicates(
    List<SObject> matchingRecords,
    List<String> fieldsToGroupBy
  ) {
    System.debug('fieldsToGroupBy --- ' + fieldsToGroupBy);
    // Map to store groups of records, key is a composite of field values
    Map<String, List<SObject>> groupedRecords = new Map<String, List<SObject>>();

    for (SObject record : matchingRecords) {
      // call the buildKey method to create a dynamic key based on the selected fields
      String key = buildKey(record, fieldsToGroupBy);
      System.debug('key ==== ' + key);

      if (!groupedRecords.containsKey(key)) {
        groupedRecords.put(key, new List<SObject>());
      }

      // Add the record to the list for this key
      groupedRecords.get(key).add(record);
    }

    return groupedRecords;
  }

  // Helper method to build a unique key from the selected fields of an SObject
  public static String buildKey(SObject record, List<String> fieldsToGroupBy) {
    System.debug('buildKey method called');
    String key = '';
    // System.debug('fieldsToGroupBy --- ' + fieldsToGroupBy);
    for (String field : fieldsToGroupBy) {
      Object value = record.get(field);
      key += (value == null ? 'null' : value.toString()) + ' & ';
    }
    // Remove the trailing ' & ' character

    return key.length() > 0 ? key.substring(0, key.length() - 3) : '';
  }
}