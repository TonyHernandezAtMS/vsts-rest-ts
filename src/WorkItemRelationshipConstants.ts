export class WorkItemRelationshipConstants {
    public static readonly ReferencedBy = 'Microsoft.VSTS.TestCase.SharedParameterReferencedBy-Forward';
    public static readonly References = 'Microsoft.VSTS.TestCase.SharedParameterReferencedBy-Reverse';
    public static readonly TestedBy = 'Microsoft.VSTS.Common.TestedBy-Forward';
    public static readonly Tests = 'Microsoft.VSTS.Common.TestedBy-Reverse';
    public static readonly TestCase = 'Microsoft.VSTS.TestCase.SharedStepReferencedBy-Forward';
    public static readonly SharedSteps = 'Microsoft.VSTS.TestCase.SharedStepReferencedBy-Reverse';
    public static readonly Duplicate = 'System.LinkTypes.Duplicate-Forward';
    public static readonly DuplicateOf = 'System.LinkTypes.Duplicate-Forward';
    public static readonly Successor = 'System.LinkTypes.Dependency-Forward';
    public static readonly Predecessor = 'System.LinkTypes.Dependency-Reverse';
    public static readonly Child = 'System.LinkTypes.Hierarchy-Forward';
    public static readonly Parent = 'System.LinkTypes.Hierarchy-Reverse';
    public static readonly Related = 'System.LinkTypes.Related';
    public static readonly AttachedFile = 'AttachedFile';
    public static readonly Hyperlink = 'Hyperlink';
    public static readonly ArtifactLink = 'ArtifactLink';
}
