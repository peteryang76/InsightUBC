#User Story 1
___
As a student, I want to enter a course name and select average grade, then click on search, so that I can know its average grade in past years to determine whether or not to take this course.

###**Definitions of Done(s)**

Scenario 1: user has entered a valid course name, and got the expected result

Given: 
- empty textbox asking for a course department.
- empty textbox asking for a course number
- a list of checkboxes to select key to be shown in the output as table header
- a search button

When the user:
- enter a valid course name, eg. cpsc
- enter a valid course number, eg. 310
- choose average grade from list
- choose optional columns/info they would like to see
- click on search button
- 
Then:

a table with columns "Course Department", "Course Number", "Course Average" and optional columns the user chose appears with average grades of each section of the given course in the table
___
Scenario 2: user does not enter a course name or a course number

Given:
- empty textbox asking for a course department.
- empty textbox asking for a course number
- a list of checkboxes to select key to be shown in the output as table header
- a search button

When the user:
- enter nothing in course name or course number or both
- choose average grade from list
- choose optional columns/info they would like to see
- click on search button

Then: an error message saying "Please enter a course name and a course number" pops up

#User Story 2
___
As a professor, I want to enter a building name and choose large group with fixed tablet, so that I can find all rooms in that building that is a type of large group with fixed tablet.
###Definitions of Done(s)

Scenario 1: A professor enters a valid building name

Given: 
- an empty textbox asking for a building name
- drop-down lists for type and furniture
- a search button

When the user:
- enter a valid building name in either short name or fullname
- choose large group from type
- choose fixed tablet from furniture
- click on search button

Then: a table with columns "building name", "room number", "room type", and "room furniture" appears
___
Scenario 2: A professor enters nothing in building name

Given:
- an empty textbox asking for a building name
- drop-down lists for type and furniture
- a search button

When the user:
- enter nothing in building name
- choose large group from type
- choose fixed tablet from furniture
- click on search button

Then: an error message saying "Please enter a building name" pops up
