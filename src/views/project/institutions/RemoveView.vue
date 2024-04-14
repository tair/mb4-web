<script>
function removeInstitution(institutionHtml) 
{
    $(institutionHtml).parent().remove();
    formChanged = true;
    return false;
}

</script>